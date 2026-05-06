import {
  DeleteObjectCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { requireEnv } from "./env";

export function createR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: requireEnv("R2_ENDPOINT"),
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export async function checkR2Bucket(): Promise<void> {
  const client = createR2Client();
  await client.send(new HeadBucketCommand({ Bucket: requireEnv("R2_BUCKET") }));
}

export async function deleteR2Object(key: string): Promise<void> {
  const client = createR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: requireEnv("R2_BUCKET"), Key: key }));
}
