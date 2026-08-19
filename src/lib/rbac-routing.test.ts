import { describe, expect, it } from "vitest";
import { tentukanAksesRute } from "./rbac-routing";

describe("tentukanAksesRute", () => {
  it("mengizinkan rute di luar peta role (mis. halaman publik)", () => {
    expect(tentukanAksesRute("/login", null)).toBe("IZINKAN");
    expect(tentukanAksesRute("/", { role: "MAHASISWA" })).toBe("IZINKAN");
  });

  it("mengarahkan ke login kalau belum ada sesi", () => {
    expect(tentukanAksesRute("/mahasiswa/pengajuan", null)).toBe("LOGIN");
    expect(tentukanAksesRute("/donatur/komitmen", null)).toBe("LOGIN");
    expect(tentukanAksesRute("/admin/transaksi", null)).toBe("LOGIN");
  });

  it("menolak akses lintas role", () => {
    expect(tentukanAksesRute("/admin/transaksi", { role: "MAHASISWA" })).toBe(
      "FORBIDDEN",
    );
    expect(tentukanAksesRute("/mahasiswa/tagihan", { role: "ORTU_ASUH" })).toBe(
      "FORBIDDEN",
    );
    expect(tentukanAksesRute("/donatur/binaan", { role: "ADMIN" })).toBe(
      "FORBIDDEN",
    );
  });

  it("mengizinkan akses dengan role yang cocok", () => {
    expect(tentukanAksesRute("/mahasiswa/tagihan", { role: "MAHASISWA" })).toBe(
      "IZINKAN",
    );
    expect(tentukanAksesRute("/donatur/binaan", { role: "ORTU_ASUH" })).toBe(
      "IZINKAN",
    );
    expect(tentukanAksesRute("/admin/transaksi", { role: "ADMIN" })).toBe(
      "IZINKAN",
    );
  });
});
