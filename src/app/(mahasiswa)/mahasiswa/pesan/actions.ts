"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { kirimPesanBinaan } from "@/server/actions/kirim-pesan-binaan";
import type { HasilAksi } from "@/types/aksi";

async function sesiMahasiswa() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MAHASISWA") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

export async function kirimPesanMahasiswa(relasiId: string, formData: FormData): Promise<HasilAksi> {
  const user = await sesiMahasiswa();
  const hasil = await kirimPesanBinaan(relasiId, user.id, { isi: formData.get("isi") });
  if (hasil.sukses) {
    revalidatePath(`/mahasiswa/pesan/${relasiId}`);
  }
  return hasil;
}
