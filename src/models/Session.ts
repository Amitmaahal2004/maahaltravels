import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ISession extends Document {
  tokenHash: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    isValid: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

export default Session;

