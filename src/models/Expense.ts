import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IExpense extends Document {
  title: string;
  category: "transportation" | "hotels" | "food" | "marketing" | "employee_expenses" | "office_expenses" | "vendor_payments" | "fuel" | "activities" | "other";
  amount: number;
  date: Date;
  bookingId?: Types.ObjectId;
  bookingRef?: string;
  vendorId?: Types.ObjectId;
  vendorName?: string;
  departmentId?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  status: "approved" | "pending" | "rejected";
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["transportation", "hotels", "food", "marketing", "employee_expenses", "office_expenses", "vendor_payments", "fuel", "activities", "other"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      index: true,
    },
    bookingRef: {
      type: String,
      trim: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
    },
    vendorName: {
      type: String,
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
      index: true,
    },
    receiptUrl: {
      type: String,
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

export const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
