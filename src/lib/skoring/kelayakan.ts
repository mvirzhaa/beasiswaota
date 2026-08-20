import {
  validasiBobotSkoring,
  type BobotSkoring,
  type StatusOrtuSkoring,
} from "./bobot.schema";

export type HitungSkorInput = {
  penghasilanOrtu: bigint;
  jmlTanggungan: number;
  statusOrtu: StatusOrtuSkoring;
  /** null bila IPK belum tercatat (mis. mahasiswa baru semester 1). */
  ipk: number | null;
  semesterBerjalan: number;
};

export type RincianKriteria = {
  nilaiMentah: string | number | null;
  skorNormalisasi: number;
  bobot: number;
  kontribusi: number;
};

export type SkorDetail = {
  bobotDipakai: BobotSkoring;
  rincian: {
    penghasilan: RincianKriteria;
    tanggungan: RincianKriteria;
    statusOrtu: RincianKriteria;
    ipk: RincianKriteria;
    semester: RincianKriteria;
  };
};

export type HasilSkor = {
  skor: number;
  detail: SkorDetail;
};

function clamp(nilai: number, min: number, maks: number): number {
  return Math.min(maks, Math.max(min, nilai));
}

function bulatkanDua(nilai: number): number {
  return Math.round(nilai * 100) / 100;
}

function skorPenghasilan(
  penghasilan: bigint,
  batasBawah: number,
  batasAtas: number,
): number {
  if (batasAtas <= batasBawah) return 0;
  const nilai = Number(penghasilan);
  if (nilai <= batasBawah) return 100;
  if (nilai >= batasAtas) return 0;
  return clamp((100 * (batasAtas - nilai)) / (batasAtas - batasBawah), 0, 100);
}

function skorTanggungan(jml: number, batasAtas: number): number {
  if (batasAtas <= 0) return 0;
  return clamp((100 * jml) / batasAtas, 0, 100);
}

function skorStatusOrtu(
  status: StatusOrtuSkoring,
  peta: Record<StatusOrtuSkoring, number>,
): number {
  return clamp(peta[status], 0, 100);
}

function skorIpk(ipk: number | null, batasBawah: number, batasAtas: number): number {
  if (ipk === null) return 0;
  if (batasAtas <= batasBawah) return 0;
  return clamp((100 * (ipk - batasBawah)) / (batasAtas - batasBawah), 0, 100);
}

function skorSemester(semester: number, batasAtas: number): number {
  if (batasAtas <= 0) return 0;
  return clamp((100 * semester) / batasAtas, 0, 100);
}

function buatRincian(
  nilaiMentah: string | number | null,
  skorNormalisasi: number,
  bobot: number,
): RincianKriteria {
  const skorBulat = bulatkanDua(skorNormalisasi);
  return {
    nilaiMentah,
    skorNormalisasi: skorBulat,
    bobot,
    kontribusi: bulatkanDua((skorBulat * bobot) / 100),
  };
}

/**
 * Fungsi murni: tidak menyentuh DB, deterministik untuk input yang sama.
 * Simulasi dan tombol "Hitung ulang skor" WAJIB memakai fungsi ini, bukan
 * menghitung ulang sendiri di tempat lain.
 */
export function hitungSkor(input: HitungSkorInput, bobot: BobotSkoring): HasilSkor {
  validasiBobotSkoring(bobot);

  const rincian = {
    penghasilan: buatRincian(
      input.penghasilanOrtu.toString(),
      skorPenghasilan(
        input.penghasilanOrtu,
        bobot.penghasilan.batasBawah,
        bobot.penghasilan.batasAtas,
      ),
      bobot.penghasilan.bobot,
    ),
    tanggungan: buatRincian(
      input.jmlTanggungan,
      skorTanggungan(input.jmlTanggungan, bobot.tanggungan.batasAtas),
      bobot.tanggungan.bobot,
    ),
    statusOrtu: buatRincian(
      input.statusOrtu,
      skorStatusOrtu(input.statusOrtu, bobot.statusOrtu.skor),
      bobot.statusOrtu.bobot,
    ),
    ipk: buatRincian(
      input.ipk,
      skorIpk(input.ipk, bobot.ipk.batasBawah, bobot.ipk.batasAtas),
      bobot.ipk.bobot,
    ),
    semester: buatRincian(
      input.semesterBerjalan,
      skorSemester(input.semesterBerjalan, bobot.semester.batasAtas),
      bobot.semester.bobot,
    ),
  };

  const skor = bulatkanDua(
    rincian.penghasilan.kontribusi +
      rincian.tanggungan.kontribusi +
      rincian.statusOrtu.kontribusi +
      rincian.ipk.kontribusi +
      rincian.semester.kontribusi,
  );

  return { skor, detail: { bobotDipakai: bobot, rincian } };
}
