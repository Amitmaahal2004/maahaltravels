import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IQuotationLineItem {
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface IQuotation extends Document {
  quotationNumber: string;
  customerId?: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  leadId?: Types.ObjectId;
  packageId?: Types.ObjectId;
  packageName?: string;
  destination: string;
  departureDate?: Date;
  durationDays: number;
  travellersCount: number;
  lineItems: IQuotationLineItem[];
  subtotal: number;
  discount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  validUntil: Date;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
  notes?: string;
  terms?: string;
  convertedBookingId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationSchema = new Schema<IQuotation>(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "Package",
    },
    packageName: {
      type: String,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    departureDate: {
      type: Date,
    },
    durationDays: {
      type: Number,
      default: 5,
    },
    travellersCount: {
      type: Number,
      default: 2,
    },
    lineItems: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        rate: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    gstRate: {
      type: Number,
      default: 5,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "viewed", "accepted", "rejected", "expired"],
      default: "draft",
      index: true,
    },
    notes: {
      type: String,
    },
    terms: {
      type: String,
    },
    convertedBookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Quotation: Model<IQuotation> =
  mongoose.models.Quotation || mongoose.model<IQuotation>("Quotation", QuotationSchema);

export default Quotation;
