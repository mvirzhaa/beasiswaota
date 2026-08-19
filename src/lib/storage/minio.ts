import { Client } from "minio";
import { env } from "../env";

// Bucket privat — TIDAK BOLEH punya URL publik (aturan keras #7). Akses
// hanya lewat signed URL berumur pendek dari buatUrlTerlindungi().
export const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ROOT_USER,
  secretKey: env.MINIO_ROOT_PASSWORD,
});

let bucketSiap: Promise<void> | null = null;

/**
 * Pastikan bucket privat ada. Idempoten dan aman dipanggil berkali-kali —
 * hasil pengecekan pertama di-cache untuk siklus hidup proses ini.
 */
export function pastikanBucket(): Promise<void> {
  if (!bucketSiap) {
    bucketSiap = (async () => {
      const ada = await minioClient.bucketExists(env.MINIO_BUCKET);
      if (!ada) {
        await minioClient.makeBucket(env.MINIO_BUCKET);
      }
    })();
  }
  return bucketSiap;
}

export async function unggahBerkas(
  objectKey: string,
  buffer: Buffer,
  mimeType: string,
): Promise<void> {
  await pastikanBucket();
  await minioClient.putObject(env.MINIO_BUCKET, objectKey, buffer, buffer.length, {
    "Content-Type": mimeType,
  });
}

export async function hapusBerkas(objectKey: string): Promise<void> {
  await pastikanBucket();
  await minioClient.removeObject(env.MINIO_BUCKET, objectKey);
}

const LIMA_MENIT_DETIK = 5 * 60;

/**
 * Signed URL berumur pendek (default 5 menit, aturan keras #7). Otorisasi
 * pemanggilan fungsi ini WAJIB sudah dicek di pemanggil (lihat
 * /api/berkas/[id]) — fungsi ini sendiri tidak tahu siapa yang meminta.
 */
export async function buatUrlTerlindungi(
  objectKey: string,
  detikKedaluwarsa = LIMA_MENIT_DETIK,
): Promise<string> {
  await pastikanBucket();
  return minioClient.presignedGetObject(
    env.MINIO_BUCKET,
    objectKey,
    detikKedaluwarsa,
  );
}
