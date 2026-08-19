import type { NextAuthConfig, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

// Konfigurasi edge-safe: TIDAK boleh mengandung provider yang menyentuh
// Prisma/argon2 (keduanya Node-only), karena file ini juga dipakai
// middleware.ts yang jalan di Edge Runtime. Provider Credentials yang
// sesungguhnya didaftarkan di src/lib/auth.ts (Node runtime).
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      // user.id selalu terisi di sini: baris ini hanya jalan tepat setelah
      // authorize() di src/lib/auth.ts mengembalikan objek user dengan id.
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
