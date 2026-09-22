import { describe, expect, it } from "vitest";
import { tentukanAksesRute } from "./rbac-routing";

describe("tentukanAksesRute", () => {
  it("mengizinkan rute di luar peta role (mis. halaman publik)", () => {
    expect(tentukanAksesRute("/login", null)).toBe("IZINKAN");
    expect(tentukanAksesRute("/", null)).toBe("IZINKAN");
    expect(tentukanAksesRute("/register", null)).toBe("IZINKAN");
    expect(tentukanAksesRute("/laporan/kode-abc", null)).toBe("IZINKAN");
  });

  it("mengarahkan ke login kalau belum ada sesi", () => {
    expect(tentukanAksesRute("/admin/transaksi", null)).toBe("LOGIN");
  });

  it("mengizinkan akses dengan role yang cocok", () => {
    expect(tentukanAksesRute("/admin/transaksi", { role: "ADMIN" })).toBe(
      "IZINKAN",
    );
  });
});
