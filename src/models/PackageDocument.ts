import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type DocumentCategory =
  | "main_brochure"
  | "detailed_itinerary"
  | "hotel_details"
  | "pricing_inclusions"
  | "terms_conditions"
  | "other";

export interface IDocumentVersion {
  versionNumber: number;
  storageKey: string;
  storageProvider: "cloudinary" | "s3" | "gridfs" | "local";
  fileUrl: string;
  fileSize: number;
  changeDescription: string;
  modifiedBy: {
    id?: Types.ObjectId | string;
    name: string;
    email: string;
  };
  modifiedAt: Date;
}

export interface IDocumentActivity {
  action:
    | "upload"
    | "edit"
    | "new_version"
    | "download"
    | "share"
    | "replace"
    | "delete"
    | "restore"
    | "generate";
  performedBy: {
    id?: Types.ObjectId | string;
    name: string;
    email?: string;
  };
  details?: string;
  timestamp: Date;
}

export interface IPackageDocument extends Document {
  packageId: Types.ObjectId;
  displayName: string;
  originalFileName: string;
  description?: string;
  category: DocumentCategory;
  storageProvider: "cloudinary" | "s3" | "gridfs" | "local";
  storageKey: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  version: number;
  isPrimary: boolean;
  isActive: boolean;
  uploadedBy: {
    id?: Types.ObjectId | string;
    name: string;
    email: string;
  };
  uploadedAt: Date;
  updatedAt: Date;
  versions: IDocumentVersion[];
  activityLogs: IDocumentActivity[];
  shareCount: number;
  lastSharedAt?: Date;
}

const PackageDocumentSchema = new Schema<IPackageDocument>(
  {
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      required: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "main_brochure",
        "detailed_itinerary",
        "hotel_details",
        "pricing_inclusions",
        "terms_conditions",
        "other",
      ],
      default: "main_brochure",
      index: true,
    },
    storageProvider: {
      type: String,
      enum: ["cloudinary", "s3", "gridfs", "local"],
      default: "gridfs",
    },
    storageKey: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
      default: 0,
    },
    mimeType: {
      type: String,
      default: "application/pdf",
    },
    version: {
      type: Number,
      default: 1,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    uploadedBy: {
      id: { type: Schema.Types.ObjectId, ref: "User" },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    versions: [
      {
        versionNumber: { type: Number, required: true },
        storageKey: { type: String, required: true },
        storageProvider: { type: String, default: "gridfs" },
        fileUrl: { type: String, required: true },
        fileSize: { type: Number, required: true },
        changeDescription: { type: String, default: "Initial upload" },
        modifiedBy: {
          id: { type: Schema.Types.ObjectId, ref: "User" },
          name: { type: String, required: true },
          email: { type: String, required: true },
        },
        modifiedAt: { type: Date, default: Date.now },
      },
    ],
    activityLogs: [
      {
        action: {
          type: String,
          enum: [
            "upload",
            "edit",
            "new_version",
            "download",
            "share",
            "replace",
            "delete",
            "restore",
            "generate",
          ],
          required: true,
        },
        performedBy: {
          id: { type: Schema.Types.ObjectId, ref: "User" },
          name: { type: String, required: true },
          email: { type: String },
        },
        details: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    shareCount: {
      type: Number,
      default: 0,
    },
    lastSharedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

PackageDocumentSchema.index({ packageId: 1, isActive: 1 });
PackageDocumentSchema.index({ packageId: 1, isPrimary: 1 });

export const PackageDocument: Model<IPackageDocument> =
  mongoose.models.PackageDocument ||
  mongoose.model<IPackageDocument>("PackageDocument", PackageDocumentSchema);

export default PackageDocument;

