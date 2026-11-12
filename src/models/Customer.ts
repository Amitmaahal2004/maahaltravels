import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  customerType: "individual" | "corporate" | "family" | "vip";
  source: "website" | "whatsapp" | "instagram" | "google" | "referral" | "other";
  assignedTo?: Types.ObjectId;
  tags: string[];
  notes?: string;
  status: "active" | "archived";
  totalSpent: number;
  bookingsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
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
      required: true,
      index: true,
      trim: true,
    },
    whatsapp: {
      type: String,
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
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    customerType: {
      type: String,
      enum: ["individual", "corporate", "family", "vip"],
      default: "individual",
    },
    source: {
      type: String,
      enum: ["website", "whatsapp", "instagram", "google", "referral", "other"],
      default: "website",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    bookingsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

CustomerSchema.index({ email: 1, phone: 1 });

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;

