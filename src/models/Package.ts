import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPackageItinerary {
  day: number;
  title: string;
  description: string;
  meals?: string;
  stay?: string;
}

export interface IPackage extends Document {
  name: string;
  slug: string;
  code: string;
  shortDescription: string;
  fullDescription?: string;
  destination: string;
  durationDays: number;
  durationNights: number;
  startingPrice: number;
  sellingPrice: number;
  internalCost: number;
  category: string;
  difficulty: "easy" | "moderate" | "challenging" | "demanding";
  featuredImage?: string;
  gallery: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: IPackageItinerary[];
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  maxTravellers?: number;
  minTravellers?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },
    fullDescription: {
      type: String,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },
    durationNights: {
      type: Number,
      required: true,
      min: 0,
    },
    startingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    internalCost: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      default: "Trekking",
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "challenging", "demanding"],
      default: "moderate",
    },
    featuredImage: {
      type: String,
    },
    gallery: [
      {
        type: String,
      },
    ],
    inclusions: [
      {
        type: String,
      },
    ],
    exclusions: [
      {
        type: String,
      },
    ],
    itinerary: [
      {
        day: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        meals: { type: String },
        stay: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    maxTravellers: {
      type: Number,
      default: 20,
    },
    minTravellers: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export const Package: Model<IPackage> =
  mongoose.models.Package || mongoose.model<IPackage>("Package", PackageSchema);

export default Package;
