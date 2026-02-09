import { S3Client } from "@aws-sdk/client-s3";

const R2_ENDPOINT = process.env.R2_ENDPOINT || "https://b4380f2027fa71158efecdeb34ebe83a.r2.cloudflarestorage.com";
const R2_BUCKET = process.env.R2_BUCKET || "event-photos";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET_NAME = R2_BUCKET;
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || `${R2_ENDPOINT}/${R2_BUCKET}`;
