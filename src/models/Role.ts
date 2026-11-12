import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { RECORD_SCOPES, RecordScope } from "@/config/permissions.config";
import { IPermission } from "./Permission";

export interface IRole extends Document {
  name: string;
  slug: string;
  description?: string;
  isSystem: boolean;
  permissions: Types.ObjectId[] | IPermission[];
  defaultRecordScope: RecordScope;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
    defaultRecordScope: {
      type: String,
      enum: RECORD_SCOPES,
      default: "all",
    },
  },
  {
    timestamps: true,
  }
);

export const Role: Model<IRole> =
  mongoose.models.Role || mongoose.model<IRole>("Role", RoleSchema);

export default Role;

