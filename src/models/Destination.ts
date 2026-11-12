import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDestination extends Document {
  name: string;
  slug: string;
  country: string;
  state: string;
  city?: string;
  description: string;
  mainImage?: string;
  gallery: string[];
  bestTimeToVisit?: string;
  weather?: string;
  attractions: string[];
  status: "published" | "draft";
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DestinationSchema = new Schema<IDestination>(
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
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    mainImage: {
      type: String,
    },
    gallery: [
      {
        type: String,
      },
    ],
    bestTimeToVisit: {
      type: String,
    },
    weather: {
      type: String,
    },
    attractions: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Destination: Model<IDestination> =
  mongoose.models.Destination || mongoose.model<IDestination>("Destination", DestinationSchema);

export default Destination;
