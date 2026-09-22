"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { parseRupiah } from "@/lib/uang";
import { pendaftaranDonaturSchema } from "@/lib/pendaftaran-donatur/schema";
import { generateJadwal, type RitmeKomitmen } from "@/lib/komitmen/jadwal";
import { ambilPeriodeUntukKomitmen } from "@/server/queries/komitmen";
import { targetMahasiswaValid } from "@/server/queries/donasi-publik";
import type { HasilAksi } from "@/types/aksi";

const NOMINAL_MINIMUM = 50_000n;

/**
 * Pendaftaran mandiri MAHASISWA sengaja tidak ada — calon penerima beasiswa
 * hanya boleh dimasukkan admin lewat /admin/mahasiswa.
 *
 * Donatur TIDAK punya akun/login sama sekali (lihat CLAUDE.md). Form ini
 * menggantikan Google Form lama: satu submit langsung membuat data OrtuAsuh
 * SEKALIGUS komitmen donasi pertamanya, keduanya menunggu konfirmasi admin.
 * Akses lihat laporan nanti lewat kodeAkses (dicantumkan di notifikasi WA),
 * bukan email+password.
 */
export async function daftarDonatur(input: unknown): Promise<HasilAksi> {
  const parsed = pendaftaranDonaturSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;

  // --- Validasi silang antar-cabang (Perorangan/Lembaga, Internal/Eksternal) ---
  const isLembaga = data.kategori === "LEMBAGA";
  const isInternal = !isLembaga && data.internal === "true";

  if (!isLembaga && data.internal === undefined) {
    return { sukses: false, pesan: "Pilih Internal atau Eksternal." };
  }

  // Alamat lengkap wajib untuk Perorangan-Eksternal dan Lembaga.
  const alamatWajib = isLembaga || (!isLembaga && !isInternal);
  if (alamatWajib && !data.alamat?.trim()) {
    return { sukses: false, pesan: "Alamat lengkap wajib diisi." };
  }

  // Potong gaji hanya untuk Perorangan-Internal. Lembaga & Eksternal wajib transfer.
  if (data.mekanisme === "POTONG_GAJI" && !isInternal) {
    return {
      sukses: false,
      pesan: "Potong gaji/payroll hanya tersedia untuk donatur internal (perorangan).",
    };
  }

  // Checklist "Atas Nama" vs "Paguyuban" — tidak berlaku untuk Lembaga,
  // dan tidak boleh dua-duanya aktif sekaligus.
  const atasNamaAktif = !isLembaga && data.atasNama === "true";
  const paguyubanAktif = !isLembaga && data.paguyuban === "true";
  if (atasNamaAktif && paguyubanAktif) {
    return { sukses: false, pesan: "Pilih salah satu: Atas Nama atau Paguyuban." };
  }
  if (atasNamaAktif && !data.namaAtasNama?.trim()) {
    return { sukses: false, pesan: "Nama untuk \"Atas Nama\" wajib diisi." };
  }
  if (paguyubanAktif && !data.namaPaguyuban?.trim()) {
    return { sukses: false, pesan: "Nama paguyuban wajib diisi." };
  }

  // --- Nominal: BigInt murni, tidak lewat number/parseFloat (aturan keras #1) ---
  let nominal: bigint;
  try {
    nominal = parseRupiah(data.nominal);
  } catch {
    return { sukses: false, pesan: "Nominal tidak valid." };
  }
  if (nominal < NOMINAL_MINIMUM) {
    return { sukses: false, pesan: "Nominal minimal Rp50.000." };
  }

  // --- Target penyaluran: earmark ke 1 mahasiswa, atau pool umum ---
  let targetMahasiswaId: string | null = null;
  if (data.targetPenyaluran === "SATU_MAHASISWA") {
    if (!data.targetMahasiswaId) {
      return { sukses: false, pesan: "Pilih mahasiswa penerima." };
    }
    const valid = await targetMahasiswaValid(data.targetMahasiswaId);
    if (!valid) {
      return { sukses: false, pesan: "Mahasiswa penerima yang dipilih tidak valid." };
    }
    targetMahasiswaId = data.targetMahasiswaId;
  }

  // --- Jadwal pengingat WA, hanya untuk komitmen berkelanjutan ---
  if (data.tipeKomitmen === "BERULANG" && !data.tanggalPengingat) {
    return { sukses: false, pesan: "Tanggal pengingat bulanan wajib diisi untuk bantuan berkelanjutan." };
  }

  // --- Periode aktif untuk komitmen pertama ---
  const periodeList = await ambilPeriodeUntukKomitmen();
  const periodeAwal =
    periodeList.find((p) => p.status === "PENDAFTARAN") ??
    periodeList.find((p) => p.status === "SELEKSI" || p.status === "PENYALURAN") ??
    periodeList[0];
  if (!periodeAwal) {
    return { sukses: false, pesan: "Belum ada periode program yang bisa menerima donasi baru." };
  }

  // Sesuai kebijakan (lihat CLAUDE.md glosarium): berkelanjutan berjalan
  // sampai maksimal 8 semester. Donatur tidak punya akun untuk membatalkan
  // sendiri — pembatalan lewat admin di /admin/komitmen kapan pun sebelum itu.
  const jumlahPeriode = data.tipeKomitmen === "SEKALI" ? 1 : 8;
  const ritme: RitmeKomitmen = data.mekanisme === "POTONG_GAJI" ? "PER_BULAN" : "PER_PERIODE";
  const tipe = data.tipeKomitmen;

  const rencana = generateJadwal({ jumlahPeriode, ritme, nominalPerPeriode: nominal }, periodeAwal);
  const barisPeriodePertama = rencana.filter((b) => b.kePeriode === 1);

  try {
    const hasil = await prisma.$transaction(async (tx) => {
      const ortuAsuh = await tx.ortuAsuh.create({
        data: {
          nama: data.nama,
          // tipe legacy dipertahankan untuk kompatibilitas & pelaporan;
          // admin bisa mengoreksi ke DOSEN/TENAGA_KEPENDIDIKAN/ALUMNI
          // secara manual kalau perlu detail lebih rinci untuk NIP payroll.
          tipe: isLembaga ? "INSTANSI" : "INDIVIDU",
          kategori: data.kategori,
          internal: isLembaga ? null : isInternal,
          noHp: data.noHp,
          email: data.email?.trim() || null,
          alamat: data.alamat?.trim() || null,
          atasNamaMunfiq: atasNamaAktif ? data.namaAtasNama!.trim() : null,
          paguyuban: paguyubanAktif,
          namaPaguyuban: paguyubanAktif ? data.namaPaguyuban!.trim() : null,
        },
      });

      const komitmen = await tx.komitmen.create({
        data: {
          ortuAsuhId: ortuAsuh.id,
          skema: data.skema,
          nominalPerPeriode: nominal,
          jumlahPeriode,
          tipe,
          mekanisme: data.mekanisme,
          ritme,
          targetMahasiswaId,
          tanggalPengingat: data.tipeKomitmen === "BERULANG" ? data.tanggalPengingat : null,
          tglMulai: periodeAwal.tglBuka,
        },
      });

      await tx.jadwalBayar.createMany({
        data: barisPeriodePertama.map((b) => ({
          komitmenId: komitmen.id,
          periodeId: periodeAwal.id,
          urutan: b.urutan,
          nominal: b.nominal,
          jatuhTempo: b.jatuhTempo,
        })),
      });

      await catatAudit(tx, {
        aktorId: null,
        aksi: "ortu_asuh.daftar",
        entitas: "ortu_asuh",
        entitasId: ortuAsuh.id,
        sesudah: { kategori: data.kategori, internal: isInternal },
      });
      await catatAudit(tx, {
        aktorId: null,
        aksi: "komitmen.buat",
        entitas: "komitmen",
        entitasId: komitmen.id,
        sesudah: {
          skema: data.skema,
          nominalPerPeriode: nominal.toString(),
          jumlahPeriode,
          mekanisme: data.mekanisme,
          targetMahasiswaId,
        },
      });

      return { ortuAsuh, komitmen };
    });

    return {
      sukses: true,
      pesan: `Pendaftaran berhasil. Komitmen donasi Anda (ID ${hasil.komitmen.id}) menunggu konfirmasi admin. Kami akan menghubungi Anda lewat WhatsApp.`,
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
    return "Data sudah terdaftar sebelumnya.";
  }
  return "Terjadi kesalahan saat mendaftar. Coba lagi.";
}
