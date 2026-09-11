import type { Metadata } from "next";
import { TampilanBrosur } from "./tampilan-brosur";

export const metadata: Metadata = {
  title: "Brosur Resmi Program Beasiswa Orang Tua Asuh",
  description:
    "Unduh dan cetak brosur resmi Program Beasiswa Orang Tua Asuh Universitas Ibn Khaldun (UIKA) Bogor untuk Donatur dan Mahasiswa.",
};

export default function HalamanBrosur() {
  return <TampilanBrosur />;
}
