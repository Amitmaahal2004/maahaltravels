import mongoose, { Document, Model, Schema } from "mongoose";
import { PERMISSION_ACTIONS, RECORD_SCOPES, SYSTEM_MODULES, PermissionAction, RecordScope, SystemModuleId } from "@/config/permissions.config";

export interface IPermission extends Document {
  module: SystemModuleId;
  action: PermissionAction;
  scope: RecordScope;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
  {
    module: {
      type: String,
      required: true,
      enum: SYSTEM_MODULES.map((m) => m.id),
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: PERMISSION_ACTIONS,
      index: true,
    },
    scope: {
      type: String,
      required: true,
      enum: RECORD_SCOPES,
      default: "all",
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

PermissionSchema.index({ module: 1, action: 1 }, { unique: true });

export const Permission: Model<IPermission> =
  mongoose.models.Permission || mongoose.model<IPermission>("Permission", PermissionSchema);

export default Permission;

