import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IEmployeeProfile extends Document {
  userId: Types.ObjectId;
  employeeId: string;
  designation: string;
  departmentId: Types.ObjectId;
  reportingManagerId?: Types.ObjectId;
  joiningDate: Date;
  employmentType: "full_time" | "part_time" | "contract" | "intern";
  salary: {
    basic: number;
    allowances: number;
    currency: string;
  };
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
  documents: Array<{
    title: string;
    fileUrl: string;
    uploadedAt: Date;
  }>;
  status: "active" | "on_notice" | "resigned" | "terminated";
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeProfileSchema = new Schema<IEmployeeProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    reportingManagerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "intern"],
      default: "full_time",
    },
    salary: {
      basic: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
    },
    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      phone: { type: String },
    },
    documents: [
      {
        title: { type: String, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["active", "on_notice", "resigned", "terminated"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const EmployeeProfile: Model<IEmployeeProfile> =
  mongoose.models.EmployeeProfile ||
  mongoose.model<IEmployeeProfile>("EmployeeProfile", EmployeeProfileSchema);

export default EmployeeProfile;
