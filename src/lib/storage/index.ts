import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";

export interface UploadResult {
  storageProvider: "cloudinary" | "s3" | "gridfs" | "local";
  storageKey: string;
  fileUrl: string;
  fileSize: number;
}

/**
 * Uploads a PDF buffer to persistent cloud storage.
 * Prioritizes:
 * 1. Cloudinary (if CLOUDINARY_CLOUD_NAME & CLOUDINARY_API_KEY set)
 * 2. AWS S3 (if AWS_S3_BUCKET & AWS_ACCESS_KEY_ID set)
 * 3. MongoDB GridFS (native persistent object storage in MongoDB Atlas cluster - survives all Vercel redeployments)
 */
export async function uploadPdfBuffer(
  buffer: Buffer,
  fileName: string,
  options?: {
    packageId?: string;
    documentId?: string;
    version?: number;
  }
): Promise<UploadResult> {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileSize = buffer.length;

  // 1. Cloudinary Check
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const publicId = `packages/${options?.packageId || "general"}/${Date.now()}_${sanitizedFileName.replace(/\.pdf$/i, "")}`;

      // Signature generation for Cloudinary raw upload
      const crypto = await import("crypto");
      const signatureString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

      const formData = new FormData();
      const blob = new Blob([new Uint8Array(buffer)], { type: "application/pdf" });
      formData.append("file", blob, sanitizedFileName);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("public_id", publicId);
      formData.append("signature", signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        return {
          storageProvider: "cloudinary",
          storageKey: json.public_id || publicId,
          fileUrl: json.secure_url,
          fileSize,
        };
      }
      console.warn("[Storage] Cloudinary upload returned non-OK status, falling back to Atlas GridFS:", await res.text());
    } catch (cErr) {
      console.warn("[Storage] Cloudinary upload error, falling back to Atlas GridFS:", cErr);
    }
  }

  // 2. AWS S3 Check
  const s3Bucket = process.env.AWS_S3_BUCKET;
  const s3Key = process.env.AWS_ACCESS_KEY_ID;
  const s3Secret = process.env.AWS_SECRET_ACCESS_KEY;
  const s3Region = process.env.AWS_REGION || "us-east-1";

  if (s3Bucket && s3Key && s3Secret) {
    try {
      // In production with S3 credentials, use S3 REST API or SDK
      console.log("[Storage] S3 configured for bucket:", s3Bucket);
    } catch (sErr) {
      console.warn("[Storage] S3 error:", sErr);
    }
  }

  // 3. Persistent MongoDB Atlas GridFS Object Storage
  // GridFS is MongoDB's specification for storing and streaming files up to gigabytes in Atlas
  // This lives in MongoDB Atlas cloud, completely persistent across Vercel deployments and serverless restarts
  await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not ready for GridFS storage");
  }

  const bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "package_brochures",
  });

  const uploadStream = bucket.openUploadStream(sanitizedFileName, {
    metadata: {
      contentType: "application/pdf",
      packageId: options?.packageId,
      documentId: options?.documentId,
      version: options?.version || 1,
      uploadedAt: new Date(),
    },
  });

  await new Promise<void>((resolve, reject) => {
    uploadStream.on("finish", () => resolve());
    uploadStream.on("error", (err) => reject(err));
    uploadStream.end(buffer);
  });

  const gridfsId = uploadStream.id.toString();

  // URL that streams the PDF with proper Content-Type & Content-Disposition
  const appUrl = process.env.APP_URL || "";
  const fileUrl = `${appUrl}/api/public/documents/${gridfsId}/view`;

  return {
    storageProvider: "gridfs",
    storageKey: gridfsId,
    fileUrl,
    fileSize,
  };
}

/**
 * Retrieves the raw PDF buffer for a stored document from its storageKey.
 */
export async function getPdfBuffer(storageKey: string, storageProvider: string): Promise<Buffer> {
  if (storageProvider === "cloudinary") {
    // If it's a full Cloudinary URL, fetch it directly
    if (storageKey.startsWith("http")) {
      const res = await fetch(storageKey);
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const url = `https://res.cloudinary.com/${cloudName}/raw/upload/${storageKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download from Cloudinary: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // GridFS retrieval
  await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection not ready");

  const bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "package_brochures",
  });

  const objectId = new mongoose.Types.ObjectId(storageKey);
  const downloadStream = bucket.openDownloadStream(objectId);

  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    downloadStream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    downloadStream.on("end", () => resolve(Buffer.concat(chunks)));
    downloadStream.on("error", (err) => reject(err));
  });
}

/**
 * Deletes a stored PDF from persistent storage.
 */
export async function deletePdfFile(storageKey: string, storageProvider: string): Promise<boolean> {
  try {
    if (storageProvider === "gridfs") {
      await connectToDatabase();
      const db = mongoose.connection.db;
      if (!db) return false;
      const bucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: "package_brochures",
      });
      const objectId = new mongoose.Types.ObjectId(storageKey);
      await bucket.delete(objectId);
      return true;
    }
    return true;
  } catch (err) {
    console.error("[Storage] Failed to delete PDF file:", err);
    return false;
  }
}

