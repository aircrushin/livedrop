"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "./client";

interface UploadResult {
  url?: string;
  error?: string;
}

export async function uploadBrandingImage(
  file: File,
  eventId: string,
  type: "logo" | "banner"
): Promise<UploadResult> {
  try {
    // Validate file
    if (!file.type.startsWith("image/")) {
      return { error: "Invalid file type. Please upload an image." };
    }

    if (file.size > 2 * 1024 * 1024) {
      return { error: "File too large. Maximum size is 2MB." };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "png";
    const key = `branding/${eventId}/${type}-${timestamp}.${extension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Return public URL
    const url = `${R2_PUBLIC_URL}/${key}`;
    return { url };
  } catch (error) {
    console.error("Error uploading branding image:", error);
    return { error: "Failed to upload image. Please try again." };
  }
}

export async function deleteBrandingImage(key: string): Promise<{ error?: string }> {
  try {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );

    return {};
  } catch (error) {
    console.error("Error deleting branding image:", error);
    return { error: "Failed to delete image" };
  }
}
