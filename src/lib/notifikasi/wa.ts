import { env } from "../env";

export interface HasilKirimWa {
  terkirim: boolean;
  alasan?: string;
}

/**
 * WA adalah kanal PELENGKAP — Notifikasi in-app di DB tetap sumber
 * kebenaran, sama seperti kirimEmail(). Kalau WA_API_URL/WA_API_TOKEN belum
 * diisi (belum ada keputusan provider WA resmi UIKA saat berkas ini
 * ditulis), fungsi ini no-op dengan jelas, tidak melempar error, supaya
 * cron tidak gagal cuma karena WA belum dikonfigurasi.
 *
 * Bentuk request POST { target, message } + header Authorization Bearer
 * cocok untuk sebagian besar provider WA gateway Indonesia (mis.
 * Fonnte/Wablas). Sesuaikan lagi persis dengan dokumentasi provider yang
 * dipilih sebelum dipakai produksi.
 */
export async function kirimWa(nomorTujuan: string, pesan: string): Promise<HasilKirimWa> {
  if (!env.WA_API_URL || !env.WA_API_TOKEN) {
    return { terkirim: false, alasan: "WA_API_URL/WA_API_TOKEN belum dikonfigurasi" };
  }

  try {
    const respons = await fetch(env.WA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.WA_API_TOKEN}`,
      },
      body: JSON.stringify({ target: nomorTujuan, message: pesan }),
    });

    if (!respons.ok) {
      return { terkirim: false, alasan: `Provider WA membalas status ${respons.status}` };
    }
    return { terkirim: true };
  } catch (error) {
    return {
      terkirim: false,
      alasan: error instanceof Error ? error.message : "Gagal menghubungi provider WA",
    };
  }
}
