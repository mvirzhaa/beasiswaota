import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { kirimPesanSchema } from "@/lib/pembinaan/schema";
import { cekKontakTerlarang } from "@/lib/pembinaan/validasi-pesan";
import { ambilRelasiUntukKirimPesan } from "@/server/queries/pesan-binaan";
import type { HasilAksi } from "@/types/aksi";

/**
 * Logika inti kirim pesan, dipakai bareng oleh Server Action donatur dan
 * mahasiswa (masing-masing sudah mengecek role-nya sendiri sebelum
 * memanggil ini). Semua pesan masuk MENUNGGU_MODERASI dulu — tidak ada
 * jalur langsung ke penerima (CLAUDE.md aturan keras #12).
 */
export async function kirimPesanBinaan(
  relasiId: string,
  userId: string,
  input: unknown,
): Promise<HasilAksi> {
  const parsed = kirimPesanSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Pesan tidak valid." };
  }

  const kontak = cekKontakTerlarang(parsed.data.isi);
  if (!kontak.diizinkan) {
    return { sukses: false, pesan: kontak.alasan ?? "Pesan mengandung kontak yang tidak diizinkan." };
  }

  const relasi = await ambilRelasiUntukKirimPesan(relasiId, userId);
  if (!relasi) {
    return { sukses: false, pesan: "Relasi tidak ditemukan atau belum bisa dikirimi pesan." };
  }

  const pesan = await prisma.$transaction(async (tx) => {
    const dibuat = await tx.pesanBinaan.create({
      data: { relasiAsuhId: relasiId, pengirimId: userId, isi: parsed.data.isi },
    });
    await catatAudit(tx, {
      aktorId: userId,
      aksi: "pesan_binaan.kirim",
      entitas: "pesan_binaan",
      entitasId: dibuat.id,
      sesudah: { relasiAsuhId: relasiId },
    });
    return dibuat;
  });

  return { sukses: true, pesan: `Pesan terkirim (ID ${pesan.id}), menunggu moderasi admin.` };
}
