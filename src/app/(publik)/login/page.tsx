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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">Masuk</h1>

      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <label className="flex flex-col gap-1">
          <span className="text-sm">Email</span>
          <input
            type="email"
            name="email"
            required
            className="rounded border px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Kata sandi</span>
          <input
            type="password"
            name="password"
            required
            className="rounded border px-3 py-2"
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
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <p className="text-sm">
        Belum punya akun? <Link href="/register" className="underline">Daftar</Link>
      </p>
    </main>
  );
}
