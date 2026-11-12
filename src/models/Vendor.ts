import mongoose, { Document, Model, Schema } from "mongoose";

export interface IVendor extends Document {
  name: string;
  type: "hotel" | "transport" | "guide" | "activity" | "restaurant" | "other";
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  services: string[];
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
  };
  balanceOwed: number;
  status: "active" | "inactive";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["hotel", "transport", "guide", "activity", "restaurant", "other"],
      required: true,
      index: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    services: [
      {
        type: String,
        trim: true,
      },
    ],
    bankDetails: {
      accountName: { type: String },
      accountNumber: { type: String },
      ifsc: { type: String },
      bankName: { type: String },
    },
    balanceOwed: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Vendor: Model<IVendor> =
  mongoose.models.Vendor || mongoose.model<IVendor>("Vendor", VendorSchema);

export default Vendor;
