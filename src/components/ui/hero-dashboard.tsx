export function HeroDashboard({ judul, subjudul }: { judul: string; subjudul: string }) {
  return (
    <div className="rounded-lg bg-gradient-to-r from-primary to-primary-dark p-6 text-white shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <p className="text-xs font-medium tracking-wide text-accent uppercase">
        Beasiswa Orangtua Asuh
      </p>
      <h1 className="mt-1 font-heading text-2xl font-bold">{judul}</h1>
      <p className="mt-1 text-sm text-white/80">{subjudul}</p>
    </div>
  );
}
