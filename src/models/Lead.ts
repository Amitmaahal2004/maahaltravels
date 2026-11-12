import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ILead extends Document {
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  destination: string;
  interestedPackageId?: Types.ObjectId;
  travelDate?: Date;
  travellersCount: number;
  budget?: number;
  leadSource: "website" | "whatsapp" | "instagram" | "facebook" | "google" | "phone" | "referral" | "walk-in" | "other";
  assignedTo?: Types.ObjectId;
  priority: "low" | "medium" | "high" | "urgent";
  status: "new" | "contacted" | "interested" | "quotation_sent" | "negotiation" | "converted" | "lost";
  notes?: string;
  followUpDate?: Date;
  convertedCustomerId?: Types.ObjectId;
  convertedBookingId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    whatsapp: {
      type: String,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    interestedPackageId: {
      type: Schema.Types.ObjectId,
      ref: "Package",
    },
    travelDate: {
      type: Date,
    },
    travellersCount: {
      type: Number,
      default: 2,
    },
    budget: {
      type: Number,
    },
    leadSource: {
      type: String,
      enum: ["website", "whatsapp", "instagram", "facebook", "google", "phone", "referral", "walk-in", "other"],
      default: "website",
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "interested", "quotation_sent", "negotiation", "converted", "lost"],
      default: "new",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    followUpDate: {
      type: Date,
    },
    convertedCustomerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    convertedBookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
  },
  {
    timestamps: true,
  }
);

export const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
