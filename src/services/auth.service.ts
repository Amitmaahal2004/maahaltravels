import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import { comparePassword, hashPassword, hashToken, generateRandomToken, validatePasswordStrength } from "@/lib/auth/password";
import { createSession, invalidateSession, invalidateAllUserSessions, serializeSafeUser } from "@/lib/auth/session";
import { logActivity } from "./audit.service";
import { SafeUser } from "@/types/auth.types";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function loginUser(
  emailInput: string,
  passwordInput: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; token?: string; user?: SafeUser; error?: string }> {
  await connectToDatabase();

  const email = emailInput.trim().toLowerCase();
  const user = await User.findOne({ email }).populate("roleId").populate("departmentId");

  if (!user) {
    return { success: false, error: "Invalid email or password." };
  }

  // Check lockout
  if (user.isLocked()) {
    const remainingMinutes = Math.ceil(
      ((user.lockUntil?.getTime() || 0) - Date.now()) / (60 * 1000)
    );
    await logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: "login_rejected_locked",
      module: "auth",
      details: { remainingMinutes },
      ipAddress,
      userAgent,
    });
    return {
      success: false,
      error: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
    };
  }

  // Check account status
  if (user.status !== "active") {
    return {
      success: false,
      error: `Your account is currently ${user.status}. Please contact an administrator.`,
    };
  }

  // Verify password
  const isMatch = await comparePassword(passwordInput, user.passwordHash);

  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      await user.save();
      await logActivity({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: "account_locked",
        module: "auth",
        details: { attempts: user.failedLoginAttempts },
        ipAddress,
        userAgent,
      });
      return {
        success: false,
        error: "Too many failed attempts. Your account has been temporarily locked for 15 minutes.",
      };
    }

    await user.save();
    await logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: "login_failed",
      module: "auth",
      details: { attempt: user.failedLoginAttempts },
      ipAddress,
      userAgent,
    });
    return { success: false, error: "Invalid email or password." };
  }

  // Password is correct, reset lockout counters
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  user.lastLoginIp = ipAddress;
  await user.save();

  // Create session
  const { rawToken } = await createSession({
    userId: user._id,
    ipAddress,
    userAgent,
  });

  const safeUser = await serializeSafeUser(user);

  await logActivity({
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    userRole: safeUser.role.slug,
    action: "login_success",
    module: "auth",
    ipAddress,
    userAgent,
  });

  return {
    success: true,
    token: rawToken,
    user: safeUser,
  };
}

export async function logoutUser(
  rawToken: string,
  user?: SafeUser,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await invalidateSession(rawToken);

  if (user) {
    await logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role.slug,
      action: "logout",
      module: "auth",
      ipAddress,
      userAgent,
    });
  }
}

export async function requestPasswordReset(
  emailInput: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; message: string; rawToken?: string }> {
  await connectToDatabase();

  const email = emailInput.trim().toLowerCase();
  const user = await User.findOne({ email });

  // Generic message returned regardless of email existence to prevent user enumeration
  const standardMessage =
    "If an active account exists for this email address, you will receive password reset instructions.";

  if (!user || user.status !== "active") {
    return { success: true, message: standardMessage };
  }

  const rawToken = generateRandomToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Invalidate any older unused reset tokens for this user
  await PasswordResetToken.updateMany(
    { userId: user._id, isUsed: false },
    { $set: { isUsed: true } }
  );

  await PasswordResetToken.create({
    tokenHash,
    userId: user._id,
    expiresAt,
    isUsed: false,
  });

  await logActivity({
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    action: "password_reset_requested",
    module: "auth",
    ipAddress,
    userAgent,
  });

  return {
    success: true,
    message: standardMessage,
    // rawToken is returned for verification/email integration
    rawToken,
  };
}

export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  await connectToDatabase();

  const strength = validatePasswordStrength(newPassword);
  if (!strength.isValid) {
    return { success: false, error: strength.message };
  }

  const tokenHash = hashToken(rawToken);
  const resetDoc = await PasswordResetToken.findOne({
    tokenHash,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!resetDoc) {
    return {
      success: false,
      error: "This password reset link is invalid, has expired, or has already been used.",
    };
  }

  const user = await User.findById(resetDoc.userId);
  if (!user || user.status !== "active") {
    return { success: false, error: "Associated user account is not active." };
  }

  // Update password
  user.passwordHash = await hashPassword(newPassword);
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  // Mark token as used
  resetDoc.isUsed = true;
  await resetDoc.save();

  // Invalidate all existing sessions for security
  await invalidateAllUserSessions(user._id);

  await logActivity({
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    action: "password_reset_completed",
    module: "auth",
    ipAddress,
    userAgent,
  });

  return {
    success: true,
    message: "Your password has been successfully reset. You may now log in with your new password.",
  };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) {
    return { success: false, error: "User not found." };
  }

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    return { success: false, error: "Current password does not match." };
  }

  const strength = validatePasswordStrength(newPassword);
  if (!strength.isValid) {
    return { success: false, error: strength.message };
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  // Invalidate prior sessions
  await invalidateAllUserSessions(user._id);

  await logActivity({
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    action: "password_changed",
    module: "auth",
    ipAddress,
    userAgent,
  });

  return { success: true, message: "Password updated successfully." };
}

