import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IWebsiteContent extends Document {
  key: string;
  title: string;
  subtitle?: string;
  content?: string;
  images: string[];
  metadata: Record<string, any>;
  isPublished: boolean;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteContentSchema = new Schema<IWebsiteContent>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
    },
    images: [
      {
        type: String,
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const WebsiteContent: Model<IWebsiteContent> =
  mongoose.models.WebsiteContent ||
  mongoose.model<IWebsiteContent>("WebsiteContent", WebsiteContentSchema);

export default WebsiteContent;
