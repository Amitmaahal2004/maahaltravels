import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IBookingTraveller {
  fullName: string;
  age: number;
  gender: "male" | "female" | "other";
  idType?: string;
  idNumber?: string;
}

export interface IBooking extends Document {
  bookingRef: string;
  customerId: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageId: Types.ObjectId;
  packageName: string;
  departureDate: Date;
  returnDate: Date;
  adults: number;
  children: number;
  infants: number;
  travellersCount: number;
  travellers: IBookingTraveller[];
  assignedStaff?: Types.ObjectId;
  bookingSource: string;
  totalAmount: number;
  discount: number;
  taxAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: "unpaid" | "partially_paid" | "paid" | "refunded";
  bookingStatus: "new" | "pending_confirmation" | "confirmed" | "in_progress" | "completed" | "cancelled";
  specialRequirements?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingRef: {
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
      required: true,
      index: true,
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
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      required: true,
      index: true,
    },
    packageName: {
      type: String,
      required: true,
      trim: true,
    },
    departureDate: {
      type: Date,
      required: true,
      index: true,
    },
    returnDate: {
      type: Date,
      required: true,
    },
    adults: {
      type: Number,
      default: 2,
      min: 1,
    },
    children: {
      type: Number,
      default: 0,
      min: 0,
    },
    infants: {
      type: Number,
      default: 0,
      min: 0,
    },
    travellersCount: {
      type: Number,
      required: true,
      min: 1,
    },
    travellers: [
      {
        fullName: { type: String, required: true },
        age: { type: Number, required: true },
        gender: { type: String, enum: ["male", "female", "other"], default: "male" },
        idType: { type: String },
        idNumber: { type: String },
      },
    ],
    assignedStaff: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    bookingSource: {
      type: String,
      default: "direct",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partially_paid", "paid", "refunded"],
      default: "unpaid",
      index: true,
    },
    bookingStatus: {
      type: String,
      enum: ["new", "pending_confirmation", "confirmed", "in_progress", "completed", "cancelled"],
      default: "confirmed",
      index: true,
    },
    specialRequirements: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
