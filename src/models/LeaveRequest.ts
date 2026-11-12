import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ILeaveRequest extends Document {
  userId: Types.ObjectId;
  userName: string;
  departmentId?: Types.ObjectId;
  leaveType: "casual" | "sick" | "annual" | "unpaid";
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: Types.ObjectId;
  approvedByName?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    leaveType: {
      type: String,
      enum: ["casual", "sick", "annual", "unpaid"],
      default: "casual",
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedByName: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const LeaveRequest: Model<ILeaveRequest> =
  mongoose.models.LeaveRequest ||
  mongoose.model<ILeaveRequest>("LeaveRequest", LeaveRequestSchema);

export default LeaveRequest;
