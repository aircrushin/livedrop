import { R2_PUBLIC_URL } from "./client";

export function getR2PublicUrl(storagePath: string): string {
  return `${R2_PUBLIC_URL}/${storagePath}`;
}
