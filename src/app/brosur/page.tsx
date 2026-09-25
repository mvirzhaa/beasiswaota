import type { Metadata } from "next";
import { ambilPengaturanLanding } from "@/server/queries/pengaturan-landing";
import { TampilanBrosur } from "./tampilan-brosur";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Brosur Resmi Program Beasiswa Orang Tua Asuh - UIKA Bogor",
  description:
    "Unduh dan cetak brosur resmi Program Beasiswa Orang Tua Asuh Universitas Ibn Khaldun (UIKA) Bogor untuk Donatur dan Mahasiswa.",
};

export default async function HalamanBrosur() {
  const landing = await ambilPengaturanLanding();
  return <TampilanBrosur landing={landing} />;
}

