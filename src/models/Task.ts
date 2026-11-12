import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ITaskComment {
  userId: Types.ObjectId;
  userName: string;
  comment: string;
  createdAt: Date;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: Date;
  assignedTo?: Types.ObjectId;
  assignedToName?: string;
  createdBy: Types.ObjectId;
  createdByName?: string;
  departmentId?: Types.ObjectId;
  status: "pending" | "in_progress" | "under_review" | "completed" | "cancelled";
  comments: ITaskComment[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    assignedToName: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: {
      type: String,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "under_review", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    comments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        userName: { type: String, required: true },
        comment: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

export default Task;
