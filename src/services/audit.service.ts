import ActivityLog from "@/models/ActivityLog";
import connectToDatabase from "@/lib/mongodb";
import { Types } from "mongoose";

export interface LogActivityParams {
  userId?: string | Types.ObjectId;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  module: string;
  recordId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await connectToDatabase();
    await ActivityLog.create({
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: params.action,
      module: params.module,
      recordId: params.recordId,
      details: params.details,
      ipAddress: params.ipAddress || "internal",
      userAgent: params.userAgent || "server",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("[AuditService] Failed to record activity log:", error);
  }
}

