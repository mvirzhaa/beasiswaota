"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction, type HasilLogin } from "./actions";

const STATE_AWAL: HasilLogin = {};

export default function HalamanLogin() {
  return (
    <Suspense fallback={null}>
      <FormLogin />
    </Suspense>
  );
}

function FormLogin() {
  const [state, formAction, pending] = useActionState(loginAction, STATE_AWAL);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-alt p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
        <p className="text-xs font-medium tracking-wide text-accent-dark uppercase">
          Beasiswa Orangtua Asuh
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-ink">Masuk</h1>
        <p className="mt-1 text-sm text-muted">Universitas Ibn Khaldun Bogor</p>

        <form action={formAction} className="mt-6 flex flex-col gap-3">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink">Email</span>
            <input
              type="email"
              name="email"
              required
              className="rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink">Kata sandi</span>
            <input
              type="password"
              name="password"
              required
              className="rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>

          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {pending ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-4 text-sm text-ink">
          Belum punya akun?{" "}
          <Link href="/register" className="text-primary underline hover:text-primary-dark">
            Daftar
          </Link>
        </p>
      </div>
    </main>
  );
}
