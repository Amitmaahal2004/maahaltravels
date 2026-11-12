import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IRole } from "./Role";
import { IDepartment } from "./Department";

export interface IUserDirectPermission {
  permissionId: Types.ObjectId;
  isGranted: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  roleId: Types.ObjectId | IRole;
  departmentId?: Types.ObjectId | IDepartment;
  directPermissions: IUserDirectPermission[];
  status: "active" | "inactive" | "suspended";
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  profileImage?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  isLocked(): boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },
    directPermissions: [
      {
        permissionId: {
          type: Schema.Types.ObjectId,
          ref: "Permission",
        },
        isGranted: {
          type: Boolean,
          default: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginIp: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

