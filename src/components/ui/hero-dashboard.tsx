import Image from "next/image";

export function HeroDashboard({
  judul,
  subjudul,
  keteranganTambahan,
}: {
  judul: string;
  subjudul: string;
  keteranganTambahan?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-dark via-primary to-[#0e584f] p-6 text-white shadow-[0_10px_30px_rgba(17,110,99,0.15)] sm:p-8">
      {/* Watermark Lambang UIKA di latar belakang */}
      <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-10 blur-[0.5px]">
        <Image
          src="/images/logo-uika.png"
          alt="Lambang UIKA"
          width={220}
          height={220}
          className="object-contain"
        />
      </div>

      {/* Decorative subtle background aura */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wider text-accent uppercase backdrop-blur-xs">
          <Image
            src="/images/logo-uika.png"
            alt="Logo UIKA"
            width={16}
            height={16}
            className="h-4 w-4 object-contain"
          />
          <span>Program Beasiswa Orangtua Asuh · UIKA</span>
        </div>

        <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-white">
          {judul}
        </h1>

        <p className="mt-1.5 text-sm sm:text-base text-white/85">
          {subjudul}
        </p>

        {keteranganTambahan && (
          <p className="mt-3 text-xs text-white/70">
            {keteranganTambahan}
          </p>
        )}
      </div>
    </div>
  );
}
