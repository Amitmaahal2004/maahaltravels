import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IHotelAllocation {
  hotelName: string;
  city: string;
  checkIn: Date;
  checkOut: Date;
  roomType: string;
  roomsCount: number;
}

export interface IChecklistItem {
  task: string;
  completed: boolean;
  completedAt?: Date;
}

export interface ITripOperation extends Document {
  operationId: string;
  bookingId: Types.ObjectId;
  bookingRef: string;
  customerName: string;
  packageName: string;
  departureDate: Date;
  returnDate: Date;
  travellersCount: number;
  tripManagerId?: Types.ObjectId;
  tripManagerName?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  guideName?: string;
  guidePhone?: string;
  hotelAllocations: IHotelAllocation[];
  checklist: IChecklistItem[];
  status: "scheduled" | "on_tour" | "completed" | "delayed" | "cancelled";
  operationalExpensesTotal: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TripOperationSchema = new Schema<ITripOperation>(
  {
    operationId: {
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
      unique: true,
      index: true,
    },
    bookingRef: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    packageName: {
      type: String,
      required: true,
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
    travellersCount: {
      type: Number,
      required: true,
      default: 2,
    },
    tripManagerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    tripManagerName: {
      type: String,
    },
    driverName: {
      type: String,
      trim: true,
    },
    driverPhone: {
      type: String,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    vehicleModel: {
      type: String,
      trim: true,
    },
    guideName: {
      type: String,
      trim: true,
    },
    guidePhone: {
      type: String,
      trim: true,
    },
    hotelAllocations: [
      {
        hotelName: { type: String, required: true },
        city: { type: String, required: true },
        checkIn: { type: Date, required: true },
        checkOut: { type: Date, required: true },
        roomType: { type: String, default: "Deluxe" },
        roomsCount: { type: Number, default: 1 },
      },
    ],
    checklist: [
      {
        task: { type: String, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
    status: {
      type: String,
      enum: ["scheduled", "on_tour", "completed", "delayed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    operationalExpensesTotal: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const TripOperation: Model<ITripOperation> =
  mongoose.models.TripOperation ||
  mongoose.model<ITripOperation>("TripOperation", TripOperationSchema);

export default TripOperation;
