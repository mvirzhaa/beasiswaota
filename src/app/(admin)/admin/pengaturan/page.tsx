import { ambilFlagNamaPenuh } from "@/server/queries/laporan";
import { ambilPengaturanLanding } from "@/server/queries/pengaturan-landing";
import { PanelPengaturan } from "./panel-pengaturan";

export default async function HalamanPengaturanAdmin() {
  const [aktif, landing] = await Promise.all([ambilFlagNamaPenuh(), ambilPengaturanLanding()]);

  return (
    <main className="mx-auto max-w-[1550px] w-full px-5 py-6 sm:px-8 sm:py-7">
      <PanelPengaturan aktifSaatIni={aktif} landing={landing} />
    </main>
  );
}

