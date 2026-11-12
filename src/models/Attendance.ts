import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IAttendance extends Document {
  userId: Types.ObjectId;
  userName: string;
  departmentId?: Types.ObjectId;
  date: string; // YYYY-MM-DD
  checkInTime?: Date;
  checkOutTime?: Date;
  totalWorkingHours: number;
  status: "present" | "late" | "half_day" | "absent" | "on_leave";
  ipAddress?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
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
    date: {
      type: String,
      required: true,
      index: true,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    totalWorkingHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["present", "late", "half_day", "absent", "on_leave"],
      default: "present",
      index: true,
    },
    ipAddress: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;
