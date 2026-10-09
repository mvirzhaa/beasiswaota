/**
 * Impor donatur yang mendaftar OFFLINE (tidak lewat form web) untuk periode 2026-1.
 *
 * Sumber data:
 * - "Data Orangtua Asuh - Per 11082026 (1).xlsx", sheet kedua ("Sheet1") -> 7 baris
 *   rekap donatur yang didata manual oleh admin, sebelum sistem ini ada.
 * - Email dicocokkan dari sheet pertama ("Form Kesediaan Orangtua Asuh UI", hasil
 *   ekspor Google Form) lewat NO WA yang sama -- sheet kedua sendiri tidak punya
 *   kolom email.
 *
 * Keputusan yang dikonfirmasi user sebelum impor ini ditulis:
 * - Status Komitmen hasil impor = MENUNGGU_KONFIRMASI (sama seperti submit lewat
 *   form web), BUKAN langsung AKTIF. Admin tetap perlu konfirmasi massal lewat
 *   /admin/keuangan/komitmen.
 * - "Maemunah Sa'diyah" muncul 2x di sheet sumber (20 Jul: "Full Beasiswa
 *   Rp4.500.000/semester selama 8 semester", mekanisme kosong -- lalu 3 Agu:
 *   "5 juta", mekanisme Potong Gaji, "sampai lulus studi (8 semester)"). Baris
 *   3 Agustus dianggap koreksi/update dari baris 20 Juli yang belum lengkap --
 *   HANYA baris 3 Agustus yang diimpor, sebagai satu OrtuAsuh + satu Komitmen.
 * - Nominal "5 juta" pada baris itu ditafsirkan Rp5.000.000 PER SEMESTER (bukan
 *   per bulan), sejalan dengan mekanisme Potong Gaji -- otomatis dipecah
 *   generateJadwal() jadi 6 baris bulanan di JadwalBayar.
 *
 * Field `internal` (civitas UIKA boleh potong gaji) di-set true untuk semua
 * baris -- ketujuh orang ini tercatat berinstansi UIKA/Fikes/FAI/Sekolah
 * Pascasarjana UIKA di sumber data. `tipe` (TipeOrtuAsuh) di-set INDIVIDU untuk
 * semua, mengikuti default yang sama dipakai pendaftaran mandiri lewat web
 * (lihat src/app/(publik)/register/actions.ts) -- detail DOSEN vs
 * TENAGA_KEPENDIDIKAN sengaja tidak ditebak di sini, biar dikoreksi admin kalau
 * perlu lewat panel admin.
 *
 * nominalPerPeriode SELALU nominal per SEMESTER (bukan per bulan), mengikuti
 * kontrak generateJadwal() (lihat src/lib/komitmen/jadwal.ts) -- untuk baris
 * dengan angka sumber "X per bulan", nominalPerPeriode = X * 6.
 *
 * Idempoten -- aman dijalankan ulang: OrtuAsuh dicari dulu berdasarkan noHp+nama
 * sebelum create, dan Komitmen dicari berdasarkan [ortuAsuhId, nominalPerPeriode,
 * jumlahPeriode, mekanisme] sebelum create (skip kalau sudah ada baris yang cocok).
 *
 * Jalankan dari ROOT repo:
 *   npx tsx prisma/import-donatur-offline-2026-1.ts
 *
 * Di server produksi (Docker), pola sama seperti
 * prisma/import-hasil-seleksi-2026-1.ts -- pakai image "migrate":
 *   docker compose --env-file .env -f deploy/docker-compose.prod.yml -p beasiswaota \
 *     run --rm --entrypoint npx migrate tsx prisma/import-donatur-offline-2026-1.ts
 *
 * Opsional, isi email admin yang menjalankan supaya tercatat di AuditLog --
 * tambahkan "-e IMPORT_ADMIN_EMAIL=admin@uika-bogor.ac.id" sebelum "--entrypoint".
 */

import { PrismaClient } from "@prisma/client";
import { catatAudit } from "../src/lib/audit";
import { generateJadwal, type RitmeKomitmen } from "../src/lib/komitmen/jadwal";

const prisma = new PrismaClient();

const KODE_PERIODE = "2026-1";

type Skema = "FULL" | "PARSIAL" | "CUSTOM";
type TipeKomitmenImpor = "SEKALI" | "BERULANG";
type Mekanisme = "TRANSFER_MANUAL" | "POTONG_GAJI";

interface BarisDonatur {
  nama: string;
  instansi: string;
  noHp: string;
  alamat: string;
  email: string | null;
  atasNamaMunfiq: string | null;
  skema: Skema;
  nominalPerPeriode: bigint; // per SEMESTER, lihat catatan di atas berkas
  jumlahPeriode: number;
  tipeKomitmen: TipeKomitmenImpor;
  mekanisme: Mekanisme;
  catatan: string | null;
  sumberAsli: string; // kolom "Skema Bantuan" + "Jangka Waktu Komitmen" asli, buat jejak audit
}

// Sumber: "Data Orangtua Asuh - Per 11082026 (1).xlsx", sheet "Sheet1".
// Email dicocokkan dari sheet "Form Kesediaan Orangtua Asuh UI" via NO WA yang sama.
const DATA_DONATUR: BarisDonatur[] = [
  {
    nama: "Maemunah Sa'diyah",
    instansi: "UIKA",
    noHp: "087770354182",
    alamat: "Bogor",
    email: "maemunah@uika-bogor.ac.id",
    atasNamaMunfiq: null,
    skema: "CUSTOM",
    nominalPerPeriode: 5_000_000n,
    jumlahPeriode: 8,
    tipeKomitmen: "BERULANG",
    mekanisme: "POTONG_GAJI",
    catatan:
      "Submission pertama (20 Jul 2026) menyebut \"Full Beasiswa Rp4.500.000/semester selama 8 semester\" tanpa mekanisme -- dianggap belum final, diganti submission 3 Agu 2026 ini.",
    sumberAsli: "Skema: \"5 juta\"; Jangka waktu: \"Sampai Mahasiswa menyelesaikan studi (8 semester)\"",
  },
  {
    nama: "Fahmi Irfani",
    instansi: "FAI Uika Bogor",
    noHp: "087877739806",
    alamat: "Kab Tangerang",
    email: "fahmiirfani@fai.uika-bogor.ac.id",
    atasNamaMunfiq: "Fahmi Irfani",
    skema: "CUSTOM",
    nominalPerPeriode: 1_800_000n, // 300.000/bulan x 6 bulan
    jumlahPeriode: 1,
    tipeKomitmen: "SEKALI",
    mekanisme: "POTONG_GAJI",
    catatan: null,
    sumberAsli: "Skema: \"300.000 per bulan\"; Jangka waktu: \"1 Semester\"",
  },
  {
    nama: "Santi Lisnawati",
    instansi: "UIKA",
    noHp: "081398560036",
    alamat: "Gardu Rt 4/8 No 55 Desa Parakanjaya Kemang Bogor",
    email: "santilisnawati@uika-bogor.ac.id",
    atasNamaMunfiq: null,
    skema: "CUSTOM",
    nominalPerPeriode: 1_000_000n,
    jumlahPeriode: 4,
    tipeKomitmen: "BERULANG",
    mekanisme: "TRANSFER_MANUAL",
    catatan: "Donatur akan menginfokan update lagi setelah 4 semester (catatan asli dari sumber).",
    sumberAsli: "Skema: \"1.000.000/semester\"; Jangka waktu: \"4 semester (akan diinfokan/update lagi setelah 4 semester)\"",
  },
  {
    nama: "Qurroh Ayuniyyah, Ph.D.",
    instansi: "Sekolah Pascasarjana UIKA Bogor",
    noHp: "081319146087",
    alamat: "Jl KH. Sholeh Iskandar Km.2 Kampus UIKA Kota Bogor",
    email: "qurroh.ayuniyyah@uika-bogor.ac.id",
    atasNamaMunfiq: null,
    skema: "CUSTOM",
    nominalPerPeriode: 3_000_000n, // 500.000/bulan x 6 bulan
    jumlahPeriode: 2,
    tipeKomitmen: "BERULANG",
    mekanisme: "POTONG_GAJI",
    catatan: null,
    sumberAsli: "Skema: \"Rp 500.000,- / bulan\"; Jangka waktu: \"2 Semester\"",
  },
  {
    nama: "Prof. Didin Hafidhuddin",
    instansi: "UIKA Bogor",
    noHp: "0811119833",
    alamat: "Kampus UIKA Bogor",
    email: "hafidhuddin@yahoo.com",
    atasNamaMunfiq: null,
    skema: "FULL",
    nominalPerPeriode: 4_500_000n,
    jumlahPeriode: 8,
    tipeKomitmen: "BERULANG",
    mekanisme: "TRANSFER_MANUAL",
    catatan: "Dibayar per semester, bukan sekaligus 8 semester (catatan asli dari sumber).",
    sumberAsli:
      "Skema: \"Full Beasiswa (Rp.4.500.000,- / Semester) selama 8 Semester\"; Jangka waktu: \"Sampai Mahasiswa menyelesaikan studi (8 semester);Dibayar per semester bukan sekaligus 8 semester\"",
  },
  {
    nama: "Dr Fenny Raharyanti, S.K.M., M.K.M",
    instansi: "Fikes",
    noHp: "08118241875",
    alamat: "Sentul",
    email: "fenny@uika-bogor.ac.id",
    atasNamaMunfiq: null,
    skema: "CUSTOM",
    nominalPerPeriode: 500_000n,
    jumlahPeriode: 1,
    tipeKomitmen: "SEKALI",
    mekanisme: "TRANSFER_MANUAL",
    catatan: null,
    sumberAsli: "Skema: \"Rp.500.000\"; Jangka waktu: \"1 Semester\"",
  },
];

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
      nominalFull: 4_300_000n, // sama seperti prisma/import-hasil-seleksi-2026-1.ts, placeholder
      tglBuka: new Date("2026-08-01"),
      tglTutup: new Date("2026-09-30"),
      status: "SELEKSI",
    },
  });

  for (const baris of DATA_DONATUR) {
    const ritme: RitmeKomitmen = baris.mekanisme === "POTONG_GAJI" ? "PER_BULAN" : "PER_PERIODE";

    await prisma.$transaction(async (tx) => {
      let ortuAsuh = await tx.ortuAsuh.findFirst({
        where: { noHp: baris.noHp, nama: baris.nama },
      });

      if (!ortuAsuh) {
        ortuAsuh = await tx.ortuAsuh.create({
          data: {
            nama: baris.nama,
            tipe: "INDIVIDU",
            kategori: "PERORANGAN",
            internal: true,
            noHp: baris.noHp,
            email: baris.email,
            alamat: baris.alamat,
            atasNamaMunfiq: baris.atasNamaMunfiq,
          },
        });

        await catatAudit(tx, {
          aktorId,
          aksi: "ortu_asuh.impor_offline",
          entitas: "ortu_asuh",
          entitasId: ortuAsuh.id,
          sesudah: {
            nama: baris.nama,
            instansi: baris.instansi,
            noHp: baris.noHp,
            sumberBerkas: "Data Orangtua Asuh - Per 11082026 (1).xlsx (sheet 2)",
          },
        });
      }

      const komitmenSudahAda = await tx.komitmen.findFirst({
        where: {
          ortuAsuhId: ortuAsuh.id,
          nominalPerPeriode: baris.nominalPerPeriode,
          jumlahPeriode: baris.jumlahPeriode,
          mekanisme: baris.mekanisme,
        },
      });
      if (komitmenSudahAda) {
        console.log(`LEWAT ${baris.nama.padEnd(32)} -- komitmen serupa sudah ada (${komitmenSudahAda.id})`);
        return;
      }

      const komitmen = await tx.komitmen.create({
        data: {
          ortuAsuhId: ortuAsuh.id,
          skema: baris.skema,
          nominalPerPeriode: baris.nominalPerPeriode,
          jumlahPeriode: baris.jumlahPeriode,
          tipe: baris.tipeKomitmen,
          mekanisme: baris.mekanisme,
          ritme,
          tglMulai: periode.tglBuka,
          catatan: baris.catatan,
          // status default MENUNGGU_KONFIRMASI -- admin konfirmasi lewat /admin/keuangan/komitmen
        },
      });

      const rencana = generateJadwal(
        { jumlahPeriode: baris.jumlahPeriode, ritme, nominalPerPeriode: baris.nominalPerPeriode },
        periode,
      );
      const barisPeriodePertama = rencana.filter((b) => b.kePeriode === 1);

      await tx.jadwalBayar.createMany({
        data: barisPeriodePertama.map((b) => ({
          komitmenId: komitmen.id,
          periodeId: periode.id,
          urutan: b.urutan,
          nominal: b.nominal,
          jatuhTempo: b.jatuhTempo,
        })),
      });

      await catatAudit(tx, {
        aktorId,
        aksi: "komitmen.impor_offline",
        entitas: "komitmen",
        entitasId: komitmen.id,
        sesudah: {
          ortuAsuhNama: baris.nama,
          skema: baris.skema,
          nominalPerPeriode: baris.nominalPerPeriode.toString(),
          jumlahPeriode: baris.jumlahPeriode,
          mekanisme: baris.mekanisme,
          sumberAsli: baris.sumberAsli,
          sumberBerkas: "Data Orangtua Asuh - Per 11082026 (1).xlsx (sheet 2)",
        },
      });

      console.log(
        `OK    ${baris.nama.padEnd(32)} Rp${baris.nominalPerPeriode.toLocaleString("id-ID")}/semester x${baris.jumlahPeriode}  (${baris.mekanisme})`,
      );
    });
  }

  console.log(`\nSelesai. ${DATA_DONATUR.length} baris donatur diproses untuk periode ${KODE_PERIODE}.`);
  console.log("Ingat: konfirmasi komitmen lewat /admin/keuangan/komitmen (status masih MENUNGGU_KONFIRMASI).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
