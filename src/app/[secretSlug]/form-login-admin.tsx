"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { loginAdminAction, type HasilLoginAdmin } from "./actions";
import { Tombol } from "@/components/ui/tombol";

const STATE_AWAL: HasilLoginAdmin = {};

export function FormLoginAdmin() {
  return (
    <Suspense fallback={null}>
      <IsiForm />
    </Suspense>
  );
}

function IsiForm() {
  const [state, formAction, pending] = useActionState(loginAdminAction, STATE_AWAL);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-navy p-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-surface p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/images/logo-uika.png"
            alt="Logo UIKA"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-dark">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Portal Admin</span>
          </div>
          <h1 className="mt-1 font-heading text-xl font-bold text-ink">
            Masuk Pengelola Program
          </h1>
        </div>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink">Alamat Email</span>
            <input
              type="email"
              name="email"
              required
              placeholder="admin@uika-bogor.ac.id"
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink">Kata Sandi</span>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {state.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
              {state.error}
            </div>
          )}

          <Tombol
            type="submit"
            disabled={pending}
            variant="primer"
            ukuran="lg"
            className="mt-2 w-full font-bold shadow-md"
          >
            <span>{pending ? "Memproses Masuk..." : "Masuk"}</span>
          </Tombol>
        </form>
      </div>
    </main>
  );
}
