import { redirect } from "next/navigation";

// Index /admin/keuangan cuma pintu masuk — tab default yang kebuka Pemasukan.
export default function HalamanKeuanganIndex() {
  redirect("/admin/keuangan/pemasukan");
}
