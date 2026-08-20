import { prisma } from "@/lib/db";

async function ortuAsuhIdDariUser(userId: string): Promise<string> {
  const ortuAsuh = await prisma.ortuAsuh.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!ortuAsuh) {
    throw new Error("Profil orang tua asuh tidak ditemukan untuk user ini");
  }
  return ortuAsuh.id;
}

export async function ambilOrtuAsuhIdUser(userId: string): Promise<string> {
  return ortuAsuhIdDariUser(userId);
}

/** Profil lengkap, dipakai untuk validasi syarat POTONG_GAJI (tipe + NIP). */
export async function ambilOrtuAsuhDariUser(userId: string) {
  const ortuAsuh = await prisma.ortuAsuh.findUnique({ where: { userId } });
  if (!ortuAsuh) {
    throw new Error("Profil orang tua asuh tidak ditemukan untuk user ini");
  }
  return ortuAsuh;
}

/** Periode yang masih boleh dipilih donatur — periode SELESAI terkunci, tidak boleh ada mutasi baru. */
export async function ambilPeriodeUntukKomitmen() {
  return prisma.periode.findMany({
    where: { status: { not: "SELESAI" } },
    orderBy: { tglBuka: "asc" },
  });
}

/** Komitmen milik donatur yang sedang login — scoping kepemilikan DI QUERY. */
export async function ambilKomitmenOrtuAsuh(userId: string) {
  const ortuAsuhId = await ortuAsuhIdDariUser(userId);
  return prisma.komitmen.findMany({
    where: { ortuAsuhId },
    orderBy: { createdAt: "desc" },
  });
}

/** Jadwal bayar milik donatur yang sedang login, untuk halaman /donatur/pembayaran. */
export async function ambilJadwalBayarOrtuAsuh(userId: string) {
  const ortuAsuhId = await ortuAsuhIdDariUser(userId);
  return prisma.jadwalBayar.findMany({
    where: { komitmen: { ortuAsuhId } },
    include: {
      periode: { select: { kode: true } },
      komitmen: { select: { skema: true, mekanisme: true } },
    },
    orderBy: { jatuhTempo: "asc" },
  });
}

/** Satu komitmen milik donatur yang sedang login — dipakai untuk cek kepemilikan sebelum mutasi. */
export async function ambilKomitmenMilikOrtuAsuh(komitmenId: string, userId: string) {
  const ortuAsuhId = await ortuAsuhIdDariUser(userId);
  const komitmen = await prisma.komitmen.findUnique({ where: { id: komitmenId } });
  if (!komitmen || komitmen.ortuAsuhId !== ortuAsuhId) {
    return null;
  }
  return komitmen;
}

/** Daftar komitmen untuk panel admin, dengan filter status opsional. */
export async function ambilDaftarKomitmenAdmin(filter: {
  status?:
    | "MENUNGGU_KONFIRMASI"
    | "AKTIF"
    | "MENUNGGAK"
    | "SELESAI"
    | "DIBATALKAN";
}) {
  return prisma.komitmen.findMany({
    where: filter.status ? { status: filter.status } : {},
    include: {
      ortuAsuh: { select: { nama: true, tipe: true, atasNamaMunfiq: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
