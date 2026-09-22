import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";
import { authConfig } from "./auth.config";
import { prisma } from "./db";
import { loginSchema } from "./auth.schema";
import { bolehLogin } from "./auth-helpers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Kata sandi", type: "password" },
      },
      async authorize(kredensial) {
        const parsed = loginSchema.safeParse(kredensial);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user || !user.passwordHash) return null;
        if (!bolehLogin(user.status)) return null;

        // Jalur publik (/login) menolak role ADMIN; jalur rahasia admin
        // (lihat src/app/[secretSlug]/) menolak selain role ADMIN. Dicek
        // sebelum verifikasi password supaya percobaan kredensial admin
        // di halaman publik selalu gagal dengan pesan yang sama generiknya.
        const cocokMode =
          parsed.data.mode === "admin" ? user.role === "ADMIN" : user.role !== "ADMIN";
        if (!cocokMode) return null;

        const cocok = await argon2.verify(user.passwordHash, parsed.data.password);
        if (!cocok) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
});
