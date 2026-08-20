"use server";

import argon2 from "argon2";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { buatPasswordSementara } from "@/lib/auth-helpers";
import {
  daftarkanMahasiswaAdminSchema,
  tolakAkunSchema,
} from "@/lib/auth.schema";
import { kirimEmail } from "@/lib/notifikasi/email";
import { templateAkunDibuatAdmin } from "@/lib/notifikasi/template";
import type { HasilAksi } from "@/types/aksi";

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

export async function verifikasiAkun(userId: string): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { sukses: false, pesan: "Akun tidak ditemukan." };
  }
  if (user.status !== "MENUNGGU_VERIFIKASI") {
    return { sukses: false, pesan: "Akun ini tidak dalam status menunggu verifikasi." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { status: "AKTIF" } });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "akun.verifikasi",
      entitas: "users",
      entitasId: userId,
      sebelum: { status: "MENUNGGU_VERIFIKASI" },
      sesudah: { status: "AKTIF" },
    });
  });

  revalidatePath("/admin/akun");
  return { sukses: true, pesan: "Akun diverifikasi dan sekarang aktif." };
}

export async function tolakAkun(userId: string, input: unknown): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const parsed = tolakAkunSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Alasan wajib diisi." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { sukses: false, pesan: "Akun tidak ditemukan." };
  }
  if (user.status !== "MENUNGGU_VERIFIKASI") {
    return { sukses: false, pesan: "Akun ini tidak dalam status menunggu verifikasi." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { status: "NONAKTIF" } });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "akun.tolak",
      entitas: "users",
      entitasId: userId,
      sebelum: { status: "MENUNGGU_VERIFIKASI" },
      sesudah: { status: "NONAKTIF", alasan: parsed.data.alasan },
    });
  });

  revalidatePath("/admin/akun");
  return { sukses: true, pesan: "Akun ditolak." };
}

function pesanErrorUnik(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const kolom = (error.meta?.target as string[] | undefined)?.join(", ");
    if (kolom?.includes("email")) return "Email sudah terdaftar.";
    if (kolom?.includes("nim")) return "NIM sudah terdaftar.";
    return "Data sudah terdaftar sebelumnya.";
  }
  throw error;
}

/**
 * Admin mendaftarkan mahasiswa (mis. camaba) langsung, tanpa lewat alur
 * pendaftaran mandiri. Akun langsung AKTIF (tindakan admin ini sendiri
 * yang jadi verifikasinya) — password sementara dibuat sistem dan
 * dikirim ke email, TIDAK PERNAH masuk AuditLog dalam bentuk plain text.
 */
export async function daftarkanMahasiswaOlehAdmin(formData: FormData): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const parsed = daftarkanMahasiswaAdminSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const data = parsed.data;

  const passwordSementara = buatPasswordSementara();
  const passwordHash = await argon2.hash(passwordSementara);

  let userId: string;
  try {
    userId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "MAHASISWA",
          status: "AKTIF",
          mahasiswa: {
            create: {
              nim: data.nim,
              nama: data.nama,
              fakultas: data.fakultas,
              prodi: data.prodi,
              angkatan: data.angkatan,
              semesterBerjalan: data.semesterBerjalan,
              noHp: data.noHp,
              alamat: data.alamat,
            },
          },
        },
      });

      await catatAudit(tx, {
        aktorId: admin.id,
        aksi: "akun.daftarkan_mahasiswa",
        entitas: "users",
        entitasId: user.id,
        sesudah: { role: "MAHASISWA", status: "AKTIF", nimSementara: data.nim },
      });

      return user.id;
    });
  } catch (error) {
    return { sukses: false, pesan: pesanErrorUnik(error) };
  }

  const hasilEmail = await kirimEmail(
    data.email,
    templateAkunDibuatAdmin({
      nama: data.nama,
      email: data.email,
      password: passwordSementara,
      loginUrl: `${env.APP_URL}/login`,
    }),
  );

  revalidatePath("/admin/akun");

  if (!hasilEmail.terkirim) {
    return {
      sukses: true,
      pesan: `Akun dibuat (ID ${userId}), tapi email gagal terkirim (${hasilEmail.alasan}). Sampaikan manual — password sementara: ${passwordSementara}`,
    };
  }
  return { sukses: true, pesan: `Akun dibuat dan password sementara dikirim ke ${data.email}.` };
}
