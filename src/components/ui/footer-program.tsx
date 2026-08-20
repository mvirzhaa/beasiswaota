import Image from "next/image";
import { Landmark, PhoneCall, ScrollText } from "lucide-react";

export function FooterProgram() {
  return (
    <footer className="border-t border-navy/40 bg-navy text-white/80">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Kolom 1: Legalitas & Universitas */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 text-white">
              <Image
                src="/images/logo-uika.png"
                alt="Logo UIKA"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
              <span className="font-heading font-bold text-base">UIKA Bogor</span>
            </div>
            <p className="text-xs leading-relaxed text-white/70">
              Sistem Beasiswa Orangtua Asuh Universitas Ibn Khaldun Bogor. Dikelola resmi di bawah
              pengawasan pimpinan universitas.
            </p>
            <div className="mt-1 flex items-start gap-1.5 text-xs text-white/60">
              <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              <span>SK Rektor No. <strong className="text-white">796/KEP/UIKA/2026</strong></span>
            </div>
          </div>

          {/* Kolom 2: Rekening Resmi */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white">
              <Landmark className="h-5 w-5 text-accent" />
              <span className="font-heading font-bold text-base">Rekening Resmi Beasiswa</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
              <p className="text-white/60">Bank Syariah Indonesia (BSI) / Rekening UIKA:</p>
              <p className="mt-1 font-mono text-sm font-bold tracking-wider text-accent">
                7367215121
              </p>
              <p className="mt-0.5 font-medium text-white">a.n. Orang Tua Asuh UIKA Bogor</p>
            </div>
          </div>

          {/* Kolom 3: Kontak Pengelola */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white">
              <PhoneCall className="h-5 w-5 text-accent" />
              <span className="font-heading font-bold text-base">Kontak Pengelola</span>
            </div>
            <ul className="flex flex-col gap-1.5 text-xs text-white/70">
              <li className="flex items-center justify-between border-b border-white/10 pb-1">
                <span>Nurseha Marasabessy, S.H.</span>
                <span className="font-mono text-white/90">0813-8315-5797</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Siti Nuraziyah, S.Ak.</span>
                <span className="font-mono text-white/90">0818-0714-6988</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-4 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Universitas Ibn Khaldun Bogor. Hak Cipta Dilindungi.
        </div>
      </div>
    </footer>
  );
}
