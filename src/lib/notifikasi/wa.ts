import { env } from "../env";
import { keFormatWaMe } from "../telepon";

export interface HasilKirimWa {
  terkirim: boolean;
  alasan?: string;
  /** Detik tunggu sebelum retry, hanya diisi kalau provider membalas 429. */
  retryAfterDetik?: number;
  /** message_id dari ChatLoop, buat disimpan di Notifikasi.pesanWaId. */
  messageId?: string;
}

interface ResponsChatLoopError {
  error?: string;
}

// Dipakai kalau 429 tidak menyertakan header Retry-After (mis. cooldown
// OTP, yang menurut spec ChatLoop memang tidak menyertakannya) — jeda aman
// default sebelum retry sekali di kirimWaBerurutan().
const RETRY_AFTER_DETIK_DEFAULT = 5;

// Batas ChatLoop: 60 request/menit, burst 20, DIBAGI BERSAMA satu API key
// (satu nomor CS) — bukan per penerima. Jeda >1 detik antar pesan di
// kirimWaBerurutan() menjaga laju kirim beruntun (cron reminder/laporan
// semester) tetap di bawah batas itu.
const JEDA_ANTAR_PESAN_MS = 1100;

function tunggu(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * WA adalah kanal PELENGKAP — Notifikasi in-app di DB tetap sumber
 * kebenaran, sama seperti kirimEmail(). Kalau WA_API_URL/WA_API_TOKEN belum
 * diisi, fungsi ini no-op dengan jelas, tidak melempar error, supaya cron
 * tidak gagal cuma karena WA belum dikonfigurasi.
 *
 * Provider resmi: ChatLoop (csai.uika-bogor.ac.id), dashboard Integrasi
 * API > Panduan & API key. WA_API_URL adalah base URL-nya
 * ("https://csai.uika-bogor.ac.id/api/v1"), endpoint kirim teks ada di
 * POST {base}/messages dengan body { to, type: "text", text } dan header
 * Authorization: Bearer <API_KEY>. Nomor tujuan wajib format internasional
 * tanpa "+" (mis. "6281234567890"), makanya nomorTujuan (format lokal dari
 * OrtuAsuh.noHp) dikonversi lewat keFormatWaMe() di sini, bukan di caller.
 *
 * Kode error yang didokumentasikan ChatLoop: 400 input salah, 401 API key
 * salah/hilang, 409 nomor CS WhatsApp tidak tersambung, 429 rate limit
 * (default 60 req/menit, burst 20/nomor — header Retry-After berisi detik
 * tunggu), 502 gagal diteruskan ke WhatsApp.
 */
export async function kirimWa(nomorTujuan: string, pesan: string): Promise<HasilKirimWa> {
  if (!env.WA_API_URL || !env.WA_API_TOKEN) {
    return { terkirim: false, alasan: "WA_API_URL/WA_API_TOKEN belum dikonfigurasi" };
  }

  try {
    const respons = await fetch(`${env.WA_API_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.WA_API_TOKEN}`,
      },
      body: JSON.stringify({ to: keFormatWaMe(nomorTujuan), type: "text", text: pesan }),
    });

    if (!respons.ok) {
      const body: ResponsChatLoopError = await respons.json().catch(() => ({}));
      if (respons.status === 429) {
        const retryAfterHeader = Number(respons.headers.get("Retry-After"));
        return {
          terkirim: false,
          alasan: body.error ?? "Terlalu banyak permintaan ke ChatLoop",
          // Selalu diisi kalau status 429 (fallback ke default), supaya
          // pemanggil bisa membedakan "429" dari kegagalan lain hanya lewat
          // ada/tidaknya field ini — lihat kirimWaBerurutan().
          retryAfterDetik: Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
            ? retryAfterHeader
            : RETRY_AFTER_DETIK_DEFAULT,
        };
      }
      return { terkirim: false, alasan: body.error ?? `ChatLoop membalas status ${respons.status}` };
    }
    const data: { message_id?: string } = await respons.json().catch(() => ({}));
    return { terkirim: true, messageId: data.message_id || undefined };
  } catch (error) {
    return {
      terkirim: false,
      alasan: error instanceof Error ? error.message : "Gagal menghubungi ChatLoop",
    };
  }
}

/**
 * Untuk kirim WA BERUNTUN dalam jumlah banyak (cron reminder komitmen
 * bulanan & notifikasi laporan semester) — BUKAN untuk kirim satu-satu dari
 * aksi admin (pakai kirimWa() langsung di sana, tidak perlu jeda).
 *
 * Menjaga laju kirim di bawah batas 60 req/menit ChatLoop lewat jeda tetap
 * antar pesan, dan kalau tetap kena 429 (mis. ada pengiriman lain yang
 * berbagi API key yang sama), coba sekali lagi setelah retryAfterDetik dari
 * provider lalu menyerah — supaya cron tidak macet menunggu tanpa batas.
 *
 * Kalau WA_API_URL/WA_API_TOKEN belum dikonfigurasi, langsung teruskan ke
 * kirimWa() (no-op instan) TANPA jeda — tidak ada rate limit sungguhan yang
 * perlu dijaga kalau tidak ada request yang benar-benar dikirim.
 */
export async function kirimWaBerurutan(nomorTujuan: string, pesan: string): Promise<HasilKirimWa> {
  if (!env.WA_API_URL || !env.WA_API_TOKEN) {
    return kirimWa(nomorTujuan, pesan);
  }

  const hasil = await kirimWa(nomorTujuan, pesan);
  if (hasil.retryAfterDetik !== undefined) {
    await tunggu(hasil.retryAfterDetik * 1000);
    const hasilUlang = await kirimWa(nomorTujuan, pesan);
    await tunggu(JEDA_ANTAR_PESAN_MS);
    return hasilUlang;
  }
  await tunggu(JEDA_ANTAR_PESAN_MS);
  return hasil;
}

export interface HasilStatusWa {
  tersambung: boolean;
  nomor?: string;
  nama?: string;
  alasan?: string;
}

/**
 * GET /status ChatLoop — cek identitas nomor CS & koneksi WhatsApp-nya.
 * Dipakai buat indikator kecil di panel admin, BUKAN prasyarat sebelum tiap
 * kirimWa() (itu bikin tiap pengiriman jadi 2 request, memboroskan jatah
 * rate limit yang sama).
 */
export async function cekStatusWa(): Promise<HasilStatusWa> {
  if (!env.WA_API_URL || !env.WA_API_TOKEN) {
    return { tersambung: false, alasan: "WA_API_URL/WA_API_TOKEN belum dikonfigurasi" };
  }

  try {
    const respons = await fetch(`${env.WA_API_URL}/status`, {
      headers: { Authorization: `Bearer ${env.WA_API_TOKEN}` },
    });

    if (!respons.ok) {
      const body: ResponsChatLoopError = await respons.json().catch(() => ({}));
      return { tersambung: false, alasan: body.error ?? `ChatLoop membalas status ${respons.status}` };
    }

    const data: { number?: string; name?: string; connected?: boolean } = await respons.json();
    return { tersambung: data.connected === true, nomor: data.number, nama: data.name };
  } catch (error) {
    return {
      tersambung: false,
      alasan: error instanceof Error ? error.message : "Gagal menghubungi ChatLoop",
    };
  }
}
