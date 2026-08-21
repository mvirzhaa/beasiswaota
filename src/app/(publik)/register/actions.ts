"use server";

import argon2 from "argon2";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import {
  registerMahasiswaSchema,
  registerOrtuAsuhSchema,
} from "@/lib/auth.schema";

export interface HasilRegistrasi {
  sukses: boolean;
  pesan: string;
}

export async function registerMahasiswa(
  input: unknown,
): Promise<HasilRegistrasi> {
  const parsed = registerMahasiswaSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;

  try {
    const passwordHash = await argon2.hash(data.password);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "MAHASISWA",
          status: "MENUNGGU_VERIFIKASI",
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
        aktorId: user.id,
        aksi: "user.daftar",
        entitas: "users",
        entitasId: user.id,
        sesudah: { role: "MAHASISWA", status: "MENUNGGU_VERIFIKASI" },
      });
    });

    return {
      sukses: true,
      pesan: "Pendaftaran berhasil. Akun Anda menunggu verifikasi admin.",
    };
  } catch (error) {
    return { sukses: false, pesan: pesanErrorUnik(error) };
  }
}

export async function registerOrtuAsuh(
  input: unknown,
): Promise<HasilRegistrasi> {
  const parsed = registerOrtuAsuhSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;

  try {
    const passwordHash = await argon2.hash(data.password);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "ORTU_ASUH",
          status: "MENUNGGU_VERIFIKASI",
          ortuAsuh: {
            create: {
              nama: data.nama,
              tipe: data.tipe,
              instansi: data.instansi,
              noHp: data.noHp,
              alamat: data.alamat,
              atasNamaMunfiq: data.atasNamaMunfiq,
            },
          },
        },
      });

      await catatAudit(tx, {
        aktorId: user.id,
        aksi: "user.daftar",
        entitas: "users",
        entitasId: user.id,
        sesudah: { role: "ORTU_ASUH", status: "MENUNGGU_VERIFIKASI" },
      });
    });

    return {
      sukses: true,
      pesan: "Pendaftaran berhasil. Akun Anda menunggu verifikasi admin.",
    };
  } catch (error) {
    return { sukses: false, pesan: pesanErrorUnik(error) };
  }
}

function pesanErrorUnik(error: unknown): string {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const kolom = (error.meta?.target as string[] | undefined)?.join(", ");
    if (kolom?.includes("email")) {
      return "Email sudah terdaftar.";
    }
    if (kolom?.includes("nim")) {
      return "NIM sudah terdaftar.";
    }
    return "Data sudah terdaftar sebelumnya.";
  }
  return "Terjadi kesalahan saat mendaftar. Coba lagi.";
}
