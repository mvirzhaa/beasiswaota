import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

// Password default untuk semua akun seed, HANYA untuk pengembangan lokal.
const PASSWORD_SEED = "password123";

async function main() {
  const passwordHash = await argon2.hash(PASSWORD_SEED);

  const admin = await prisma.user.upsert({
    where: { email: "admin@uika-bogor.ac.id" },
    update: {},
    create: {
      email: "admin@uika-bogor.ac.id",
      passwordHash,
      role: "ADMIN",
      status: "AKTIF",
    },
  });

  const dataMahasiswa = [
    {
      email: "mahasiswa1@uika-bogor.ac.id",
      nim: "1200001",
      nama: "Ahmad Fauzi",
      fakultas: "Fakultas Teknik",
      prodi: "Teknik Informatika",
      angkatan: 2023,
      semesterBerjalan: 5,
      noHp: "081200000001",
    },
    {
      email: "mahasiswa2@uika-bogor.ac.id",
      nim: "1200002",
      nama: "Siti Nurhaliza",
      fakultas: "Fakultas Ekonomi",
      prodi: "Manajemen",
      angkatan: 2023,
      semesterBerjalan: 5,
      noHp: "081200000002",
    },
    {
      email: "mahasiswa3@uika-bogor.ac.id",
      nim: "1200003",
      nama: "Budi Santoso",
      fakultas: "Fakultas Pertanian",
      prodi: "Agroteknologi",
      angkatan: 2024,
      semesterBerjalan: 3,
      noHp: "081200000003",
    },
  ];

  for (const mhs of dataMahasiswa) {
    await prisma.user.upsert({
      where: { email: mhs.email },
      update: {},
      create: {
        email: mhs.email,
        passwordHash,
        role: "MAHASISWA",
        status: "AKTIF",
        mahasiswa: {
          create: {
            nim: mhs.nim,
            nama: mhs.nama,
            fakultas: mhs.fakultas,
            prodi: mhs.prodi,
            angkatan: mhs.angkatan,
            semesterBerjalan: mhs.semesterBerjalan,
            noHp: mhs.noHp,
          },
        },
      },
    });
  }

  const dataOrtuAsuh = [
    {
      email: "ortuasuh1@example.com",
      nama: "H. Abdullah",
      tipe: "INDIVIDU" as const,
      noHp: "081300000001",
      noHpAlternatif: "081300000011",
    },
    {
      email: "ortuasuh2@uika-bogor.ac.id",
      nama: "Dr. Rina Wijaya",
      tipe: "DOSEN" as const,
      nip: "198501012010012001",
      noHp: "081300000002",
      noHpAlternatif: "081300000022",
    },
  ];

  for (const oa of dataOrtuAsuh) {
    await prisma.user.upsert({
      where: { email: oa.email },
      update: {},
      create: {
        email: oa.email,
        passwordHash,
        role: "ORTU_ASUH",
        status: "AKTIF",
        ortuAsuh: {
          create: {
            nama: oa.nama,
            tipe: oa.tipe,
            nip: "nip" in oa ? oa.nip : undefined,
            noHp: oa.noHp,
            noHpAlternatif: oa.noHpAlternatif,
          },
        },
      },
    });
  }

  const periode = await prisma.periode.upsert({
    where: { kode: "2026-1" },
    update: {},
    create: {
      kode: "2026-1",
      tahunAkademik: "2026/2027",
      semester: 1,
      nominalFull: 5_000_000n,
      tglBuka: new Date("2026-08-01"),
      tglTutup: new Date("2026-09-30"),
      status: "PENDAFTARAN",
    },
  });

  console.log("Seed selesai:");
  console.log(`  Admin      : ${admin.email}`);
  console.log(`  Mahasiswa  : ${dataMahasiswa.length} akun`);
  console.log(`  Ortu asuh  : ${dataOrtuAsuh.length} akun`);
  console.log(`  Periode    : ${periode.kode} (${periode.status})`);
  console.log(`  Password semua akun seed: ${PASSWORD_SEED}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
