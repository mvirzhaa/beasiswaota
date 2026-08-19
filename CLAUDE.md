# CLAUDE.md

Konteks proyek untuk Claude Code. Baca ini sebelum mengerjakan tugas apa pun.

---

## Proyek

Sistem Beasiswa Orangtua Asuh — Universitas Ibn Khaldun (UIKA) Bogor.
Dasar hukum: SK Rektor Nomor 796/KEP/UIKA/2026.

Menggantikan Google Form pendaftaran yang ada sekarang. Tiga role: **mahasiswa** (pendaftar penerima), **orangtua asuh / munfiq** (donatur), **admin** (pengelola program).

**Model bisnis inti — ini yang membedakan dari sistem donasi biasa:** dana donatur TIDAK di-earmark ke satu mahasiswa. Semua dana masuk ke pool per periode, lalu dibagi mesin alokasi ke beberapa mahasiswa. Satu donasi bisa terpecah ke banyak mahasiswa; satu mahasiswa bisa dibiayai banyak donatur. Donatur bisa membayar sekali (one time) atau berulang sampai 8 semester.

---

## Deployment

| Item | Nilai |
|---|---|
| Domain aplikasi | `beasiswaota.uika-bogor.ac.id` |
| Email pengirim | `beasiswaota@uika-bogor.ac.id` |
| Hosting | VPS milik UIKA, bukan Vercel |

Konsekuensi karena VPS, bukan serverless:

- Cron pakai systemd timer atau cron sistem yang memanggil endpoint dengan `CRON_SECRET`, bukan Vercel Cron
- Butuh Nginx reverse proxy + Certbot untuk TLS
- Proses Next.js dijalankan lewat PM2 dengan nama proses `beasiswaota`
- Storage pakai MinIO di VPS yang sama atau bucket terpisah; jangan taruh berkas di dalam folder `public/`
- Webhook payment gateway butuh URL publik ber-TLS valid — pastikan sertifikat beres sebelum menyalakan gateway
- Semua URL absolut ambil dari `env.APP_URL`, jangan pernah hardcode nama domain di dalam kode

## Stack

Next.js 15 App Router · TypeScript strict · PostgreSQL 16 · Prisma · Auth.js v5 · Zod · Tailwind · MinIO (bucket privat) · PM2 · Nginx

---

## Aturan keras

Langgar salah satu dari ini dan sistemnya tidak akan lolos audit keuangan. Kalau ada tugas yang tampaknya mengharuskan melanggar, **berhenti dan tanya dulu**, jangan diakali.

1. **Uang selalu `BigInt`, satuan Rupiah penuh, tanpa sen.** Tidak ada `number`, tidak ada `float`, tidak ada `parseFloat` di jalur perhitungan nominal. Format ke string hanya di lapisan tampilan (`lib/uang.ts`).

2. **Tiga lapisan keuangan tidak boleh digabung.** `Komitmen` (janji bayar) → `Transaksi` (uang masuk) → `Alokasi` (uang keluar). Jangan pernah membuat shortcut yang langsung menghubungkan donatur ke mahasiswa.

3. **`Tagihan.terbayar` hanya boleh diubah di dalam `setujuiBatch()`.** Tidak ada tempat lain. Ini penjaga agar tagihan tidak pernah bergerak tanpa persetujuan.

4. **Setiap alokasi wajib punya baris `AlokasiSumber`.** Total `AlokasiSumber` per transaksi tidak boleh melebihi `Transaksi.nominal`. Tabel ini yang menjawab "uang saya masuk ke siapa" — tanpa itu sistem tidak bisa dipertanggungjawabkan ke munfiq.

5. **RBAC tiga lapis, semuanya wajib:** middleware → guard di `layout.tsx` → cek kepemilikan di dalam action/query. Lapis ketiga yang paling sering terlewat dan jadi celah IDOR. Mahasiswa A tidak boleh membaca pengajuan mahasiswa B walau tahu ID-nya.

6. **Semua mutasi status transaksi dan alokasi masuk `AuditLog`** dengan aktor, IP, dan snapshot sebelum/sesudah.

7. **Berkas pengajuan (SKTM, slip gaji, foto rumah) tidak boleh punya URL publik.** Bucket privat, akses lewat signed URL ≤5 menit, otorisasi dicek ulang tiap request.

8. **Maker-checker.** Yang menjalankan mesin alokasi tidak boleh jadi yang menyetujui batch. Yang mengunggah bukti transfer tidak boleh jadi yang memverifikasi.

9. **Operasi keuangan konkuren wajib pakai advisory lock** `pg_advisory_xact_lock(4711, hashtext(periodeId))` di dalam `prisma.$transaction`. Berlaku untuk verifikasi transaksi dan eksekusi alokasi.

10. **Relasi pembinaan (`RelasiAsuh`) tidak boleh diturunkan dari aliran dana.** Jangan pernah menulis query yang menentukan "mahasiswa binaan saya" lewat `AlokasiSumber`. Yang menentukan hanya `RelasiAsuh` yang ditugaskan admin.

11. **Donatur hanya boleh melihat data akademik mahasiswa binaannya bila `RelasiAsuh.persetujuanMahasiswa` bernilai true.** Selama false, tampilkan agregat tanpa identitas. Cek ini di lapisan query, bukan di komponen UI — kalau hanya disembunyikan di UI, datanya tetap terkirim ke browser.

12. **Tidak ada pertukaran kontak langsung antara donatur dan mahasiswa.** Nomor HP, email, dan alamat mahasiswa tidak boleh pernah masuk ke payload mana pun yang diakses role `ORTU_ASUH`. Komunikasi lewat `PesanBinaan` yang dimoderasi admin. Mahasiswa di sini bergantung secara finansial pada donatur, dan relasi kuasa seperti itu perlu perantara.

---

## Bahasa & penamaan

- **Domain pakai Bahasa Indonesia**: `Pengajuan`, `Komitmen`, `Alokasi`, `jalankanAlokasi()`, `verifikasiTransaksi()`.
- **Infrastruktur pakai Inggris**: `middleware`, `handler`, `client`, `config`.
- Kolom DB `snake_case` lewat `@map`, field Prisma `camelCase`.
- Semua teks yang dilihat user (label, pesan error, notifikasi) dalam Bahasa Indonesia.
- Komentar kode Bahasa Indonesia, dan hanya untuk menjelaskan **kenapa**, bukan **apa**.

---

## Perintah

```bash
npm run dev
npm run build
npx prisma migrate dev --name <nama>
npx prisma studio
npx prisma db seed
npm test                    # vitest
npm run test -- alokasi     # test mesin alokasi saja
npx tsc --noEmit            # wajib bersih sebelum commit
```

---

## Glosarium domain

| Istilah | Arti |
|---|---|
| Munfiq | Pemberi donasi (istilah Islam). Bisa berbeda dari pendaftar — donasi boleh diatasnamakan orang lain, mis. orangtua yang sudah wafat |
| Orangtua asuh | Donatur; individu, dosen, tendik, alumni, atau instansi |
| UKT | Uang Kuliah Tunggal — tagihan mahasiswa per semester |
| Potong gaji | Mekanisme khusus dosen/tendik UIKA; ritmenya **bulanan**, bukan per semester |
| Pool | Kumpulan dana terverifikasi yang belum dialokasikan |
| Batch | Satu kali eksekusi mesin alokasi |
| Periode | Semester akademik (mis. 2026-1) |
| Relasi asuh | Pasangan donatur ↔ mahasiswa binaan untuk monitoring. Ditugaskan admin, **terpisah dari aliran dana** |
| Mahasiswa binaan | Mahasiswa yang dipantau seorang donatur lewat `RelasiAsuh` — bukan berarti dana donatur itu yang membiayainya |
| Laporan perkembangan | Laporan berkala mahasiswa, syarat perpanjangan beasiswa periode berikutnya |
| Tingkat risiko | Status peringatan dini: AMAN, PERHATIAN, KRITIS |

---

## Berkas rujukan

- `prisma/schema.prisma` — model data lengkap, sudah final. Jangan ubah tanpa konfirmasi.
- `src/lib/alokasi/engine.ts` — mesin alokasi. `susunRencana()` adalah fungsi murni; simulasi dan eksekusi WAJIB memakai fungsi yang sama, hanya beda flag `dryRun`.
- `ARSITEKTUR.md` — struktur folder, peta endpoint, urutan pembangunan.

---

## Definition of done

Sebuah tugas belum selesai sampai:

- [ ] `npx tsc --noEmit` bersih
- [ ] Validasi input pakai Zod di sisi server, bukan hanya di client
- [ ] Cek kepemilikan ada di setiap action/query yang mengakses data milik user
- [ ] Mutasi keuangan tercatat di `AuditLog`
- [ ] Ada test untuk logika yang menyentuh uang
- [ ] Tidak ada `console.log` tersisa, tidak ada `any`, tidak ada `@ts-ignore`

---

## Jangan lakukan

- Jangan buat migration destruktif tanpa konfirmasi
- Jangan install dependensi baru tanpa menjelaskan alasannya
- Jangan bikin UI elaborate dulu — tema visual mengikuti web UIKA dan dikerjakan di fase terakhir
- Jangan menulis ulang `engine.ts`; kalau ada yang perlu diubah, jelaskan dulu apa dan kenapa
- Jangan asumsikan nominal beasiswa seragam — `Periode.nominalFull` masih menunggu konfirmasi apakah berbeda per prodi
