import { describe, expect, it } from "vitest";
import { SELECT_MAHASISWA_UNTUK_DONATUR } from "./relasi";

const FIELD_KONTAK_TERLARANG = ["noHp", "noHpAlternatif", "alamat", "email"];

/**
 * Test statis atas struktur query, bukan atas hasil live query — supaya
 * tetap bisa dijalankan tanpa database (lihat CLAUDE.md aturan keras #12:
 * kontak mahasiswa tidak boleh pernah masuk payload yang diakses ORTU_ASUH).
 * Kalau field kontak baru ditambahkan ke select ini di masa depan, test ini
 * akan gagal sebelum sempat ter-deploy.
 */
describe("SELECT_MAHASISWA_UNTUK_DONATUR", () => {
  it("tidak pernah memilih field kontak mahasiswa (noHp/alamat/email)", () => {
    const kunci = Object.keys(SELECT_MAHASISWA_UNTUK_DONATUR);
    for (const terlarang of FIELD_KONTAK_TERLARANG) {
      expect(kunci).not.toContain(terlarang);
    }
  });

  it("hanya memilih field identitas akademik yang memang dibutuhkan tampilan", () => {
    expect(Object.keys(SELECT_MAHASISWA_UNTUK_DONATUR).sort()).toEqual(
      ["fakultas", "id", "nama", "nim", "prodi"].sort(),
    );
  });
});
