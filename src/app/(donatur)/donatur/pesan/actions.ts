"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { kirimPesanBinaan } from "@/server/actions/kirim-pesan-binaan";
import type { HasilAksi } from "@/types/aksi";

async function sesiOrtuAsuh() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORTU_ASUH") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

export async function kirimPesanOrtuAsuh(relasiId: string, formData: FormData): Promise<HasilAksi> {
  const user = await sesiOrtuAsuh();
  const hasil = await kirimPesanBinaan(relasiId, user.id, { isi: formData.get("isi") });
  if (hasil.sukses) {
    revalidatePath(`/donatur/pesan/${relasiId}`);
  }
  return hasil;
}
