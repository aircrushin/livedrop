"use server";

import { PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "./client";

export async function uploadToR2(
  fileName: string,
  fileData: Uint8Array | Buffer,
  contentType: string = "image/jpeg"
): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    const body = Buffer.from(fileData);
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: body,
      ContentType: contentType,
    });

    await r2Client.send(command);

    return {
      success: true,
      url: `${R2_PUBLIC_URL}/${fileName}`,
    };
  } catch (error) {
    console.error("R2 upload error:", error);
    return {
      success: false,
      url: "",
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function deleteFromR2(fileName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
    });

    await r2Client.send(command);

    return { success: true };
  } catch (error) {
    console.error("R2 delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

export async function deleteMultipleFromR2(fileNames: string[]): Promise<{ success: boolean; error?: string }> {
  if (fileNames.length === 0) return { success: true };

  try {
    const command = new DeleteObjectsCommand({
      Bucket: R2_BUCKET_NAME,
      Delete: {
        Objects: fileNames.map((key) => ({ Key: key })),
      },
    });

    await r2Client.send(command);

    return { success: true };
  } catch (error) {
    console.error("R2 batch delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Batch delete failed",
    };
  }
}


