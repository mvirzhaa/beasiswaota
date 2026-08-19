import { describe, expect, it } from "vitest";
import { assertPemilik, type UserSesi } from "./rbac-core";

describe("assertPemilik", () => {
  it("meloloskan pemilik data itu sendiri", () => {
    const user: UserSesi = { id: "u1", role: "MAHASISWA" };
    expect(() => assertPemilik("u1", user)).not.toThrow();
  });

  it("menolak user lain yang bukan pemilik", () => {
    const user: UserSesi = { id: "u2", role: "MAHASISWA" };
    expect(() => assertPemilik("u1", user)).toThrow();
  });

  it("meloloskan ADMIN walau bukan pemilik", () => {
    const admin: UserSesi = { id: "admin1", role: "ADMIN" };
    expect(() => assertPemilik("u1", admin)).not.toThrow();
  });
});
