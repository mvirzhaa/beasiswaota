/**
 * Impor hasil seleksi beasiswa OTA periode 2026-1 (mahasiswa baru angkatan 2026).
 *
 * Sumber data:
 * - "rekap hasil beasiwa ota-rev1.xlsx", sheet "Lampiran Pengumuman" -> NIM, nama,
 *   prodi, dan hasil seleksi (Bebas biaya UKT / UKT Rp X,- Per Semester).
 * - "Biaya Perluliahan TA. 2026-2027 edit.pdf", tabel Kelas Reguler -> UKT penuh per
 *   prodi = SPP + Biaya SKS Semester I + Biaya UAS Semester I (komponen daftar
 *   ulang/dana pembangunan/sumbangan fasilitas TIDAK dihitung karena itu biaya
 *   masuk sekali bayar, bukan UKT berjalan) -- lihat UKT_PENUH_PER_PRODI di bawah.
 *
 * "Sisa dibayar sendiri" di hasil seleksi adalah keputusan panitia per mahasiswa
 * (bukan formula tetap per prodi -- dua mahasiswa Ekonomi Syariah punya sisa
 * bayar berbeda). Nominal yang ditanggung beasiswa = UKT penuh prodi - sisa bayar
 * sendiri, lalu ditulis sebagai Tagihan.nominal (yang akan dialokasikan mesin
 * alokasi dari pool, bukan di-earmark -- lihat CLAUDE.md aturan keras #2).
 *
 * noHp mahasiswa TIDAK ada di sumber data manapun. Diisi placeholder
 * "BELUM_DIISI_<NIM>" supaya mudah dicari & dilengkapi admin lewat halaman
 * Kelola Data Mahasiswa sebelum periode ini dipakai live.
 *
 * Server produksi pakai Docker (lihat deploy/docker-compose.prod.yml) -- jalankan
 * dari ROOT repo di VPS, pakai image "migrate" yang sudah punya Prisma CLI + tsx
 * (stage "builder"), bukan image "app" (stage "runner" tidak bawa node_modules
 * lengkap). Build dulu kalau berkas ini baru di-pull:
 *
 *   git pull
 *   docker compose --env-file .env -f deploy/docker-compose.prod.yml -p beasiswaota build migrate
 *   docker compose --env-file .env -f deploy/docker-compose.prod.yml -p beasiswaota \
 *     run --rm --entrypoint npx migrate tsx prisma/import-hasil-seleksi-2026-1.ts
 *
 * --entrypoint npx menimpa entrypoint default service "migrate" (yang aslinya
 * "npx prisma migrate deploy") supaya argumen sesudah nama service
 * ("tsx prisma/import-hasil-seleksi-2026-1.ts") dijalankan, bukan ditambahkan ke
 * "npx prisma migrate deploy".
 *
 * Opsional, isi email admin yang menjalankan supaya tercatat di AuditLog --
 * tambahkan "-e IMPORT_ADMIN_EMAIL=admin@uika-bogor.ac.id" sebelum "--entrypoint":
 *   docker compose --env-file .env -f deploy/docker-compose.prod.yml -p beasiswaota \
 *     run --rm -e IMPORT_ADMIN_EMAIL=admin@uika-bogor.ac.id --entrypoint npx migrate \
 *     tsx prisma/import-hasil-seleksi-2026-1.ts
 *
 * Idempoten -- aman dijalankan ulang (upsert berdasarkan NIM / kode periode /
 * [mahasiswaId, periodeId, komponen]).
 *
 * PERIKSA SEBELUM DIPAKAI LIVE:
 * - Periode.nominalFull di bawah masih nilai sementara (lihat komentar di sana).
 * - Periode.tglBuka/tglTutup/jatuhTempo tagihan masih tanggal perkiraan.
 * - Kelas Kesehatan Masyarakat diasumsikan Pagi/reguler (bukan Sore/karyawan).
 * - NIM 4102660011 (Zikran Al-Hakim): hasil seleksi aslinya "UKT Rp 1.500.000,-
 *   Per Semester DIMULAI SEMESTER 2" -- semester 1 ini ditulis bebas penuh, nanti
 *   saat periode 2026-2 dibuat, admin perlu input Tagihan dengan sisa bayar
 *   sendiri Rp 1.500.000 (ditanggung beasiswa = UKT penuh - 1.500.000).
 */

import { PrismaClient } from "@prisma/client";
import { catatAudit } from "../src/lib/audit";

const prisma = new PrismaClient();

const KODE_PERIODE = "2026-1";
const NIM_SUBSIDI_MULAI_SEMESTER_2 = "4102660011";

// UKT penuh per semester = SPP (Rp 2.500.000, flat semua prodi) + Biaya SKS
// Semester I + Biaya UAS Semester I, dari tabel "Kelas Reguler" di PDF biaya.
const UKT_PENUH_PER_PRODI: Record<string, bigint> = {
  "S1 - Manajemen": 5_700_000n,
  "S1 - Ekonomi Syariah": 4_300_000n,
  "S1 - Kesehatan Masyarakat": 5_500_000n, // kelas Pagi/reguler
  "S1 - Pendidikan Bahasa Inggris": 4_500_000n,
  "S1 - Pendidikan Agama Islam": 4_300_000n,
  "S1 - Bimbingan dan Konseling Pendidikan Islam": 4_300_000n,
  "S1 - Gizi": 6_100_000n,
  "S1 - Bisnis Digital": 4_100_000n,
  "S1 - Teknik Mesin": 5_500_000n,
  "S1 - Pendidikan Masyarakat": 4_500_000n,
  "S1 - Ilmu Al-Qur`an dan Tafsir": 4_100_000n,
};

const FAKULTAS_PER_PRODI: Record<string, string> = {
  "S1 - Manajemen": "Ekonomi dan Bisnis",
  "S1 - Ekonomi Syariah": "Agama Islam",
  "S1 - Kesehatan Masyarakat": "Ilmu Kesehatan",
  "S1 - Pendidikan Bahasa Inggris": "Keguruan dan Ilmu Pendidikan",
  "S1 - Pendidikan Agama Islam": "Agama Islam",
  "S1 - Bimbingan dan Konseling Pendidikan Islam": "Agama Islam",
  "S1 - Gizi": "Ilmu Kesehatan",
  "S1 - Bisnis Digital": "Ekonomi dan Bisnis",
  "S1 - Teknik Mesin": "Teknik dan Sains",
  "S1 - Pendidikan Masyarakat": "Keguruan dan Ilmu Pendidikan",
  "S1 - Ilmu Al-Qur`an dan Tafsir": "Agama Islam",
};

interface BarisHasilSeleksi {
  nim: string;
  nama: string;
  prodi: string;
  hasilSeleksi: string;
}

// Sumber: "rekap hasil beasiwa ota-rev1.xlsx", sheet "Lampiran Pengumuman".
const DATA_HASIL_SELEKSI: BarisHasilSeleksi[] = [
  { nim: "4102660025", nama: "Aura Kusmawardani", prodi: "S1 - Manajemen", hasilSeleksi: "Bebas biaya UKT" },
  { nim: "4101261959", nama: "Arfa Abdullah", prodi: "S1 - Ekonomi Syariah", hasilSeleksi: "UKT Rp. 1.500.000,- Per Semester" },
  { nim: "4102660016", nama: "Casey Sachio Syabana", prodi: "S1 - Ekonomi Syariah", hasilSeleksi: "Bebas biaya UKT" },
  { nim: "4102660027", nama: "Euis Widya Astuti", prodi: "S1 - Kesehatan Masyarakat", hasilSeleksi: "UKT Rp. 1.000.000,- Per Semester" },
  { nim: "4102660014", nama: "Faiz Abdurrahman", prodi: "S1 - Pendidikan Bahasa Inggris", hasilSeleksi: "Bebas biaya UKT" },
  { nim: "4102660022", nama: "Fauzan Syakib", prodi: "S1 - Pendidikan Agama Islam", hasilSeleksi: "Bebas biaya UKT" },
  { nim: "4102640397", nama: "Halimah Tussadiah", prodi: "S1 - Bimbingan dan Konseling Pendidikan Islam", hasilSeleksi: "Bebas UKT" },
  { nim: "4102660026", nama: "Istiqomah Amalia", prodi: "S1 - Gizi", hasilSeleksi: "UKT Rp. 500.000,- Per Semester" },
  { nim: "4102660012", nama: "Muhamad Ibnu Hajibbi", prodi: "S1 - Bisnis Digital", hasilSeleksi: "Bebas biaya UKT" },
  { nim: "4102640335", nama: "Muhammad Farhan Hidayatullah", prodi: "S1 - Ekonomi Syariah", hasilSeleksi: "UKT Rp. 500.000,- Per Semester" },
  { nim: "4102660010", nama: "Muhammad Raisa Dwi Putra", prodi: "S1 - Teknik Mesin", hasilSeleksi: "Bebas biaya UKT" },
  { nim: "4102660019", nama: "Muhammad Rizky Sabar", prodi: "S1 - Pendidikan Masyarakat", hasilSeleksi: "UKT Rp. 1.500.000,- Per Semester" },
  { nim: "4102620071", nama: "Muliadi", prodi: "S1 - Ilmu Al-Qur`an dan Tafsir", hasilSeleksi: "UKT Rp. 1.000.000,- Per Semester" },
  { nim: "4102660023", nama: "Nurahmah", prodi: "S1 - Gizi", hasilSeleksi: "UKT Rp. 1.000.000,- Per Semester" },
  { nim: "4102660006", nama: "Sarrah Amalya Supendi", prodi: "S1 - Bimbingan dan Konseling Pendidikan Islam", hasilSeleksi: "Bebas biaya UKT" },
  { nim: "4102660011", nama: "Zikran Al-Hakim", prodi: "S1 - Ilmu Al-Qur`an dan Tafsir", hasilSeleksi: "UKT Rp. 1.500.000,- Per Semester dimulai semester 2" },
];

function hitungSisaBayarSendiri(hasilSeleksi: string): bigint {
  const cocok = hasilSeleksi.match(/Rp\.?\s*([\d.]+)/);
  if (!cocok) return 0n; // "Bebas biaya UKT" / "Bebas UKT"
  return BigInt(cocok[1].replace(/\./g, ""));
}

async function main() {
  const adminEmail = process.env.IMPORT_ADMIN_EMAIL ?? null;
  let aktorId: string | null = null;
  if (adminEmail) {
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
      console.warn(`Peringatan: IMPORT_ADMIN_EMAIL "${adminEmail}" tidak ditemukan, AuditLog dicatat tanpa aktor.`);
    } else {
      aktorId = admin.id;
    }
  }

  const periode = await prisma.periode.upsert({
    where: { kode: KODE_PERIODE },
    update: {},
    create: {
      kode: KODE_PERIODE,
      tahunAkademik: "2026/2027",
      semester: 1,
      // PLACEHOLDER -- UKT penuh beda2 per prodi (lihat UKT_PENUH_PER_PRODI),
      // nilai ini cuma dipakai sbg acuan umum. Konfirmasi sebelum dipakai live.
      nominalFull: 4_300_000n,
      tglBuka: new Date("2026-08-01"),
      tglTutup: new Date("2026-09-30"),
      status: "SELEKSI",
    },
  });

  const jatuhTempoTagihan = new Date("2026-10-31"); // perkiraan, sesuaikan kalau perlu

  for (const baris of DATA_HASIL_SELEKSI) {
    const fakultas = FAKULTAS_PER_PRODI[baris.prodi];
    const uktPenuh = UKT_PENUH_PER_PRODI[baris.prodi];
    if (!fakultas || uktPenuh === undefined) {
      throw new Error(`Prodi tidak dikenali: "${baris.prodi}" (NIM ${baris.nim})`);
    }

    const sisaBayarSendiri = hitungSisaBayarSendiri(baris.hasilSeleksi);
    let ditanggungBeasiswa = uktPenuh - sisaBayarSendiri;
    if (baris.nim === NIM_SUBSIDI_MULAI_SEMESTER_2) {
      // Lihat catatan di komentar atas berkas ini.
      ditanggungBeasiswa = uktPenuh;
    }
    if (ditanggungBeasiswa < 0n) {
      throw new Error(`Sisa bayar sendiri lebih besar dari UKT penuh prodi "${baris.prodi}" (NIM ${baris.nim}) -- cek data.`);
    }

    await prisma.$transaction(async (tx) => {
      const mahasiswa = await tx.mahasiswa.upsert({
        where: { nim: baris.nim },
        update: {},
        create: {
          nim: baris.nim,
          nama: baris.nama,
          fakultas,
          prodi: baris.prodi,
          angkatan: 2026,
          semesterBerjalan: 1,
          noHp: `BELUM_DIISI_${baris.nim}`,
        },
      });

      const tagihan = await tx.tagihan.upsert({
        where: {
          mahasiswaId_periodeId_komponen: {
            mahasiswaId: mahasiswa.id,
            periodeId: periode.id,
            komponen: "UKT",
          },
        },
        update: { nominal: ditanggungBeasiswa, jatuhTempo: jatuhTempoTagihan },
        create: {
          mahasiswaId: mahasiswa.id,
          periodeId: periode.id,
          komponen: "UKT",
          nominal: ditanggungBeasiswa,
          jatuhTempo: jatuhTempoTagihan,
        },
      });

      await catatAudit(tx, {
        aktorId,
        aksi: "mahasiswa.impor_hasil_seleksi",
        entitas: "tagihan",
        entitasId: tagihan.id,
        sesudah: {
          nim: baris.nim,
          nama: baris.nama,
          prodi: baris.prodi,
          hasilSeleksiAsli: baris.hasilSeleksi,
          uktPenuh: uktPenuh.toString(),
          sisaBayarSendiri: sisaBayarSendiri.toString(),
          nominalDitanggungBeasiswa: ditanggungBeasiswa.toString(),
          sumberBerkas: "rekap hasil beasiwa ota-rev1.xlsx + Biaya Perluliahan TA. 2026-2027 edit.pdf",
        },
      });
    });

    console.log(`OK  ${baris.nim}  ${baris.nama.padEnd(30)}  Tagihan Rp${ditanggungBeasiswa.toLocaleString("id-ID")}`);
  }

  console.log(`\nSelesai. ${DATA_HASIL_SELEKSI.length} mahasiswa diproses untuk periode ${KODE_PERIODE}.`);
  console.log("Ingat: lengkapi noHp mahasiswa (placeholder BELUM_DIISI_<NIM>) lewat halaman Kelola Data Mahasiswa.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
