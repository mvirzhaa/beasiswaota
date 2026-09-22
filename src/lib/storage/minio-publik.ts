import { Client } from "minio";
import { env } from "../env";

// Bucket PUBLIK — kebalikan dari minio.ts (privat, signed URL 5 menit).
// Dipakai HANYA untuk aset landing page (logo/hero/pimpinan/foto keluarga),
// bukan berkas pengajuan (SKTM, slip gaji, dst — itu tetap wajib lewat
// minio.ts, aturan keras #7). Bucket terpisah supaya kebijakan akses publik
// tidak pernah bersentuhan dengan bucket privat.
export const minioClientPublik = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ROOT_USER,
  secretKey: env.MINIO_ROOT_PASSWORD,
});

function kebijakanBacaPublik(bucket: string) {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });
}

let bucketPublikSiap: Promise<void> | null = null;

/**
 * Pastikan bucket publik ada DAN kebijakan baca-publiknya terpasang.
 * Idempoten, di-cache untuk siklus hidup proses ini (pola sama seperti
 * pastikanBucket() di minio.ts).
 */
export function pastikanBucketPublik(): Promise<void> {
  if (!bucketPublikSiap) {
    bucketPublikSiap = (async () => {
      const ada = await minioClientPublik.bucketExists(env.MINIO_BUCKET_PUBLIK);
      if (!ada) {
        await minioClientPublik.makeBucket(env.MINIO_BUCKET_PUBLIK);
      }
      await minioClientPublik.setBucketPolicy(
        env.MINIO_BUCKET_PUBLIK,
        kebijakanBacaPublik(env.MINIO_BUCKET_PUBLIK),
      );
    })();
  }
  return bucketPublikSiap;
}

export async function unggahAsetPublik(
  objectKey: string,
  buffer: Buffer,
  mimeType: string,
): Promise<void> {
  await pastikanBucketPublik();
  await minioClientPublik.putObject(env.MINIO_BUCKET_PUBLIK, objectKey, buffer, buffer.length, {
    "Content-Type": mimeType,
  });
}

/**
 * URL permanen (BUKAN signed — bucket ini memang publik). Di production,
 * endpoint MinIO ini harus diteruskan Nginx ke publik (lihat catatan di
 * deploy/systemd/README.md) supaya URL ini benar-benar bisa diakses browser
 * donatur/pengunjung.
 */
export function urlAsetPublik(objectKey: string): string {
  const skema = env.MINIO_USE_SSL ? "https" : "http";
  return `${skema}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${env.MINIO_BUCKET_PUBLIK}/${objectKey}`;
}
