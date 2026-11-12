import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IPayment extends Document {
  paymentId: string;
  bookingId: Types.ObjectId;
  bookingRef: string;
  invoiceId?: Types.ObjectId;
  invoiceNumber?: string;
  customerId: Types.ObjectId;
  customerName: string;
  amount: number;
  paymentMethod: "upi" | "bank_transfer" | "razorpay" | "cash" | "card" | "other";
  transactionRef: string;
  paymentDate: Date;
  status: "completed" | "pending" | "failed" | "refunded";
  recordedBy?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    bookingRef: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "bank_transfer", "razorpay", "cash", "card", "other"],
      required: true,
      default: "upi",
      index: true,
    },
    transactionRef: {
      type: String,
      required: true,
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["completed", "pending", "failed", "refunded"],
      default: "completed",
      index: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
