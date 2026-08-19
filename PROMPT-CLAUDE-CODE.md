# Prompt Claude Code — Sistem Beasiswa Orangtua Asuh UIKA

Satu prompt = satu sesi. Jalankan berurutan, jangan digabung.

**Cara pakai tiap sesi:**
1. `/clear` dulu — konteks sisa dari sesi sebelumnya membuat Claude Code melebar ke hal yang tidak diminta
2. Tekan `Shift+Tab` dua kali untuk masuk **plan mode**, paste prompt, baca rencananya
3. Setujui kalau rencananya benar, koreksi kalau melenceng
4. Setelah selesai: `npx tsc --noEmit && npm test`, lalu commit

---

## Persiapan

```bash
mkdir beasiswa-ota-uika && cd beasiswa-ota-uika
git init
# salin CLAUDE.md dan ARSITEKTUR.md ke root
# salin schema.prisma dan engine.ts ke folder mana saja dulu, biarkan di root
claude
```

---

## Sesi 0 — Bootstrap

```
Bootstrap proyek Next.js untuk sistem di CLAUDE.md. Jangan tulis fitur apa pun dulu,
hanya kerangka yang bisa jalan.

Yang saya butuhkan:
1. Next.js 15 App Router + TypeScript strict mode + Tailwind, package manager npm
2. Prisma + PostgreSQL. Pindahkan schema.prisma yang ada di root ke prisma/schema.prisma
   apa adanya, jangan diubah isinya. Jalankan migration awal.
3. docker-compose.yml untuk PostgreSQL 16 dan MinIO (S3-compatible), lengkap dengan
   .env.example. Aplikasi akan di-deploy ke VPS UIKA di domain
   beasiswaota.uika-bogor.ac.id dengan email pengirim beasiswaota@uika-bogor.ac.id,
   jadi sediakan APP_URL, MAIL_FROM, dan CRON_SECRET di .env.example.
   Buat src/lib/env.ts yang memvalidasi semua environment variable dengan Zod
   saat startup dan gagal keras kalau ada yang kurang. Semua URL absolut nanti
   ambil dari env.APP_URL, jangan pernah hardcode nama domain.
4. Vitest + konfigurasinya
5. Struktur folder persis seperti bagian 2 di ARSITEKTUR.md, buat folder kosong dengan
   .gitkeep untuk yang belum diisi
6. Pindahkan engine.ts ke src/lib/alokasi/engine.ts, sesuaikan import path saja,
   jangan ubah logikanya
7. src/lib/db.ts berisi singleton PrismaClient
8. src/lib/uang.ts: formatRupiah(bigint) dan parseRupiah(string). Beri unit test untuk
   keduanya, termasuk kasus nol, angka besar, dan input tidak valid.

Setelah selesai pastikan `npm run dev` jalan, `npx prisma migrate dev` sukses,
dan `npx tsc --noEmit` bersih.
```

---

## Sesi 1 — Auth dan RBAC

```
Bangun autentikasi dan otorisasi. Baca aturan keras nomor 5 di CLAUDE.md dulu.

1. Auth.js v5 credentials provider, password di-hash dengan argon2
2. Session menyimpan id, email, dan role
3. src/lib/rbac.ts berisi:
   - requireRole(...roles) untuk dipakai di layout dan server action
   - assertPemilik(pemilikId, user) yang meloloskan ADMIN tapi menolak user lain
4. middleware.ts yang memetakan route group ke role:
   /mahasiswa -> MAHASISWA, /donatur -> ORTU_ASUH, /admin -> ADMIN
5. Guard requireRole() di layout.tsx tiap route group
6. Halaman /login, /register, /403 — polos saja, styling menyusul
7. Registrasi: mahasiswa daftar dengan NIM, ortu asuh daftar dengan data dari
   form lama (nama, instansi, email, no HP, no HP alternatif, alamat, atas nama munfiq).
   Semua user baru berstatus MENUNGGU_VERIFIKASI.
8. src/lib/audit.ts: catatAudit(tx, {aktorId, aksi, entitas, entitasId, sebelum, sesudah})
   yang menerima Prisma transaction client
9. Seed: 1 admin, 3 mahasiswa, 2 ortu asuh, 1 periode aktif

Test yang saya mau ada:
- assertPemilik menolak user lain dan meloloskan admin
- middleware menolak akses lintas role
- user MENUNGGU_VERIFIKASI tidak bisa login
```

---

## Sesi 2 — Pengajuan mahasiswa

```
Bangun alur pengajuan beasiswa dari sisi mahasiswa dan verifikasinya oleh admin.
Perhatikan aturan keras nomor 7 di CLAUDE.md soal berkas.

Sisi mahasiswa (/mahasiswa/pengajuan):
1. Server Action simpanPengajuan: draft dan submit terpisah. Validasi Zod di server.
2. Satu mahasiswa hanya boleh satu pengajuan per periode — sudah ada unique constraint,
   tangani error-nya dengan pesan yang jelas dalam Bahasa Indonesia
3. Pengajuan hanya bisa diedit selama status DRAFT
4. Upload berkas ke MinIO bucket privat. Simpan object key, bukan URL. Batasi
   PDF/JPG/PNG maksimal 5MB. Hitung checksum sha256 tiap berkas.
5. GET /api/berkas/[id]: signed URL 5 menit. Cek otorisasi tiap request —
   pemilik berkas atau admin saja. Ini titik IDOR paling rawan, tolong hati-hati.

Sisi admin (/admin/pengajuan):
6. Daftar pengajuan dengan filter periode dan status
7. Panel verifikasi: lihat berkas, tandai tiap berkas VALID/TIDAK_VALID,
   setujui atau tolak pengajuan dengan catatan wajib kalau menolak
8. Semua perubahan status masuk AuditLog

Yang belum: skoring kelayakan, itu sesi berikutnya. Untuk sekarang kolom skor
diisi manual oleh admin.
```

---

## Sesi 3 — Skoring kelayakan

```
Bangun src/lib/skoring/kelayakan.ts.

Fungsi murni hitungSkor(input) yang mengembalikan skor 0-100 dan rincian per kriteria,
disimpan ke Pengajuan.skor dan Pengajuan.skorDetail.

Kriteria dan bobot ambil dari tabel Pengaturan dengan kunci "skoring.bobot",
jangan hardcode — pengelola program harus bisa mengubahnya tanpa deploy ulang.
Bobot default:
- Penghasilan orangtua per bulan: 35%, makin rendah makin tinggi skor
- Jumlah tanggungan keluarga: 20%, makin banyak makin tinggi
- Status orangtua (lengkap/yatim/piatu/yatim piatu): 25%
- IPK: 15%, sebagai penyaring kelayakan akademik minimal
- Semester berjalan: 5%, sedikit menguntungkan yang hampir lulus

Normalisasi tiap kriteria ke skala 0-100 dulu sebelum dikalikan bobot.
Untuk penghasilan pakai batas bawah dan atas yang juga disimpan di Pengaturan.

Yang penting:
- Fungsi harus deterministik dan tidak menyentuh database. Input berupa objek biasa.
- Simpan snapshot bobot yang dipakai ke dalam skorDetail. Kalau bobot berubah
  tahun depan, skor lama harus tetap bisa dijelaskan asal-usulnya.
- Kalau total bobot tidak sama dengan 100, lempar error saat startup, jangan diam-diam
  dinormalisasi.

Test: kasus batas (penghasilan nol, penghasilan di atas batas atas, IPK kosong),
determinisme, dan validasi total bobot.

Tambahkan juga tombol "Hitung ulang skor" di panel admin untuk satu periode,
yang menghitung ulang semua pengajuan berstatus DIAJUKAN atau VERIFIKASI_BERKAS.
```

---

## Sesi 4 — Komitmen dan jadwal bayar

```
Bangun sisi orangtua asuh: komitmen dan jadwal pembayarannya.

1. Server Action buatKomitmen di /donatur/komitmen:
   - Skema: FULL (sesuai Periode.nominalFull), PARSIAL, atau CUSTOM
   - Jangka waktu: 1, 2, atau 8 semester, atau custom
   - Mekanisme: TRANSFER_MANUAL, VIRTUAL_ACCOUNT, POTONG_GAJI, LAINNYA
   - POTONG_GAJI hanya boleh dipilih kalau tipe donatur DOSEN atau
     TENAGA_KEPENDIDIKAN dan NIP terisi. Validasi ini di server.

2. src/lib/komitmen/jadwal.ts — generateJadwal(komitmen, periodeAwal):
   - Ritme PER_PERIODE: satu baris JadwalBayar per periode
   - Ritme PER_BULAN: enam baris per periode dengan kolom urutan 1-6.
     Nominal per bulan = nominalPerPeriode dibagi 6. Sisa pembagian
     ditambahkan ke cicilan terakhir supaya totalnya persis, jangan dibulatkan
     ke setiap baris.
   - Jatuh tempo dihitung dari Periode.tglBuka
   - Fungsi murni, tidak menyentuh DB. Yang menulis DB adalah pemanggilnya.

3. Halaman /donatur/pembayaran: daftar jadwal bayar dengan status dan sisa hari

4. Server Action batalkanKomitmen: ubah status jadi DIBATALKAN, batalkan semua
   JadwalBayar yang belum terbayar. Jadwal yang sudah terbayar tidak boleh disentuh.

5. Panel admin untuk konfirmasi komitmen baru dari MENUNGGU_KONFIRMASI ke AKTIF

Test generateJadwal:
- 8 semester ritme per periode menghasilkan 8 baris
- 1 semester ritme per bulan menghasilkan 6 baris, total persis sama dengan
  nominalPerPeriode
- nominal yang tidak habis dibagi 6, misalnya Rp 4.500.001
```

---

## Sesi 5 — Transaksi dan ledger

```
Ini sesi yang menyentuh uang. Baca ulang aturan keras 1, 3, 6, 8, dan 9 di CLAUDE.md
sebelum mulai.

1. Server Action unggahBuktiTransfer (role ORTU_ASUH):
   - Buat Transaksi status MENUNGGU_VERIFIKASI
   - Bukti transfer ke bucket privat, sama seperti berkas pengajuan
   - Boleh dikaitkan ke JadwalBayar tertentu, boleh juga donasi lepas tanpa komitmen

2. Server Action verifikasiTransaksi (role ADMIN):
   - Bungkus dalam prisma.$transaction dengan advisory lock
     pg_advisory_xact_lock(4711, hashtext(periodeId))
   - Update pakai where: { id, status: 'MENUNGGU_VERIFIKASI' } supaya dua admin yang
     menekan tombol bersamaan tidak menghasilkan double credit
   - Tulis DanaLedger tipe KREDIT dengan saldoSetelah
   - Kalau ada jadwalBayarId, tandai JadwalBayar jadi TERBAYAR
   - Catat AuditLog
   - Verifikator tidak boleh sama dengan pengunggah bukti. Tolak kalau sama.

3. src/lib/keuangan/ledger.ts: hitungSaldo(tx, periodeId) yang membaca dari
   DanaLedger, bukan menjumlah tabel transaksi.

4. Panel admin /admin/transaksi: daftar menunggu verifikasi, lihat bukti,
   verifikasi atau tolak dengan alasan

5. Halaman /donatur/pembayaran menampilkan riwayat transaksi dan statusnya

Test:
- Verifikasi ganda pada transaksi yang sama hanya menghasilkan satu entri ledger
- saldoSetelah selalu konsisten dengan urutan entri
- Transaksi DITOLAK tidak masuk ledger
```

---

## Sesi 6 — Mesin alokasi

```
Sambungkan src/lib/alokasi/engine.ts ke aplikasi. JANGAN tulis ulang logikanya —
kalau ada yang menurutmu perlu diubah, jelaskan dulu apa dan kenapa sebelum
mengubah apa pun.

1. Server Action simulasiAlokasi (ADMIN): panggil jalankanAlokasi dengan dryRun true.
   Halaman /admin/alokasi/simulasi menampilkan: saldo awal, daftar calon penerima
   beserta peringkat dan skornya, total dialokasikan, saldo akhir yang digulirkan,
   dan antrian yang belum kebagian.

2. Server Action eksekusiAlokasi (ADMIN): dryRun false, hasilnya batch berstatus DRAFT.

3. Halaman /admin/alokasi/[batchId]: review batch, tampilkan rincian sumber dana
   tiap alokasi (dari AlokasiSumber), lalu tombol setujui.

4. Server Action setujuiBatchAlokasi memanggil setujuiBatch(). Wajib aktor berbeda
   dari yang mengeksekusi batch — cek Alokasi.dibuatOlehId dan tolak kalau sama.

5. Halaman /donatur/laporan: laporan penyaluran memakai laporanPenyaluran().
   Default samarkan nama mahasiswa jadi inisial plus prodi, misalnya "A.S. — Teknik
   Informatika". Tambahkan flag di tabel Pengaturan untuk membuka nama penuh.

6. Halaman /mahasiswa/tagihan: sisa tagihan dan riwayat bantuan yang diterima.
   Kalau donatur memilih anonim, tampilkan "Hamba Allah". Kalau tidak, tampilkan
   atasNamaMunfiq bila terisi, selain itu nama donatur.

Sekarang tulis test lengkap untuk engine.ts, minimal yang ini:
- Saldo persis pas untuk N mahasiswa menghasilkan tepat N penerima dan saldo akhir nol
- Saldo kurang satu rupiah dari tagihan kandidat teratas: mode KUOTA_TUNTAS melewatinya
  dan mencoba kandidat berikutnya
- Satu transaksi terpecah ke tiga mahasiswa, jumlah AlokasiSumber sama dengan
  nominal transaksi
- Dua kali run dengan data identik menghasilkan urutan penerima identik
- Total AlokasiSumber per transaksi tidak pernah melebihi Transaksi.nominal
- Saldo pool tidak pernah negatif
- Dua eksekusi konkuren pada periode yang sama tidak menghasilkan double-spend

Yang terakhir butuh test integrasi dengan database sungguhan, bukan mock.
```

---

## Sesi 7 — Monitoring dan pembinaan

```
Bangun modul monitoring mahasiswa. Baca aturan keras 10, 11, dan 12 di CLAUDE.md
sebelum mulai — modul ini menyentuh data pribadi mahasiswa dan relasi kuasa antara
donatur dan penerima, jadi batasannya ketat.

Prinsip yang tidak boleh dilanggar: relasi pembinaan TIDAK diturunkan dari aliran
dana. Jangan pernah menulis query yang menentukan "mahasiswa binaan saya" lewat
AlokasiSumber. Yang menentukan hanya tabel RelasiAsuh.

1. Panel admin /admin/pembinaan:
   - Tugaskan pasangan donatur ↔ mahasiswa binaan, satu donatur boleh membina
     beberapa mahasiswa
   - Alihkan binaan ke pembina lain dengan alasan wajib
   - Akhiri relasi kalau mahasiswa lulus atau berhenti jadi penerima
   - Semua penugasan dan perubahan masuk AuditLog

2. Persetujuan mahasiswa:
   - Setelah ditugaskan, mahasiswa mendapat notifikasi dan halaman untuk
     menyetujui atau menolak datanya dipantau donatur
   - Selama persetujuanMahasiswa false, donatur hanya melihat data agregat
     tanpa identitas: jumlah binaan dan rata-rata progres, tanpa nama
   - Mahasiswa boleh menarik persetujuan kapan saja tanpa kehilangan beasiswa.
     Pastikan tidak ada jalur kode yang mengaitkan penarikan persetujuan dengan
     status pengajuan atau alokasi.
   - Terapkan cek persetujuan di lapisan query di src/server/queries/,
     bukan di komponen. Kalau hanya disembunyikan di UI, datanya tetap
     terkirim ke browser.

3. MonitoringAkademik per periode:
   - Form admin untuk input IPK, IP semester, SKS, status akademik, kehadiran
   - Import XLSX untuk input massal, dengan preview sebelum commit
   - src/lib/monitoring/risiko.ts: fungsi murni hitungRisiko() yang mengembalikan
     AMAN, PERHATIAN, atau KRITIS. Ambang batasnya dari tabel Pengaturan,
     jangan hardcode. Default: IPK di bawah 2.50 atau turun lebih dari 0.5 poin
     dari semester lalu = PERHATIAN; status CUTI atau DO = KRITIS.
   - Beri unit test untuk hitungRisiko termasuk kasus data semester pertama
     yang belum punya pembanding

4. LaporanPerkembangan:
   - Mahasiswa mengisi laporan tiap periode, lampiran scan KHS ke bucket privat
   - Laporan jadi syarat perpanjangan: kalau belum DIVERIFIKASI dan periode
     berikutnya sudah dibuka, tampilkan peringatan di dashboard mahasiswa
   - Admin mereview: verifikasi atau minta revisi dengan catatan
   - Mahasiswa boleh menandai laporan tidak dibaca pembina lewat
     bolehDibacaPembina

5. Dashboard donatur /donatur/binaan:
   - Daftar mahasiswa binaan dengan progres IPK antar semester
   - Grafik sederhana perkembangan IPK, pakai recharts
   - Laporan perkembangan yang boleh dibaca
   - JANGAN tampilkan nomor HP, email, atau alamat mahasiswa. Pastikan
     field-field itu tidak ikut ter-select di query, bukan sekadar tidak
     dirender. Tulis test yang memeriksa payload query tidak mengandung
     field kontak.

6. Dashboard admin /admin/monitoring:
   - Daftar semua penerima aktif dengan tingkat risiko, filter per fakultas
   - Panel peringatan dini: siapa yang PERHATIAN dan KRITIS periode ini
   - Siapa yang belum mengirim laporan perkembangan menjelang batas kirim

7. PesanBinaan:
   - Donatur dan mahasiswa binaan bisa berkirim pesan, tapi semuanya masuk
     antrian MENUNGGU_MODERASI dulu
   - Panel admin untuk meneruskan atau menolak dengan alasan
   - Blokir pengiriman kalau isi pesan mengandung pola nomor telepon atau
     alamat email, beri pesan error yang menjelaskan kenapa

Test yang saya mau ada:
- Donatur A tidak bisa mengakses data mahasiswa binaan donatur B walau tahu ID-nya
- Donatur tidak bisa melihat identitas mahasiswa yang persetujuanMahasiswa masih false
- Payload query dashboard donatur tidak pernah memuat noHp, email, atau alamat
- Menarik persetujuan tidak mengubah status pengajuan atau alokasi apa pun
```

---

## Sesi 8 — Otomasi

```
Bangun lapisan otomasi.

1. Payment gateway Midtrans Snap:
   - src/lib/payment/midtrans.ts untuk membuat transaksi Snap dari JadwalBayar
   - POST /api/webhook/payment: verifikasi signature key, idempoten lewat unique
     constraint di Transaksi.refEksternal
   - Jangan percaya nominal dari payload. Cocokkan ke JadwalBayar, tolak kalau beda.
   - Webhook yang lolos verifikasi langsung membuat Transaksi berstatus TERVERIFIKASI
     dan menulis ledger, memakai jalur kode yang sama dengan verifikasi manual

2. Impor batch potong gaji:
   - Ekspor XLSX daftar potongan bulan berjalan untuk dikirim ke payroll
   - Impor XLSX realisasi, buat Transaksi TERVERIFIKASI dengan refEksternal nomor batch
   - Tampilkan preview sebelum commit, dan tolak baris yang NIP-nya tidak cocok

3. Cron. Aplikasi jalan di VPS, bukan Vercel, jadi buat endpoint yang dipanggil
   cron sistem, plus contoh systemd timer di folder deploy/:
   - POST /api/cron/jadwal-bayar: generate JadwalBayar periode berikutnya untuk semua
     komitmen AKTIF yang belum habis jangka waktunya
   - POST /api/cron/reminder: notifikasi H-7 dan H-1 jatuh tempo, tandai remindedAt
     supaya tidak dobel
   - POST /api/cron/laporan-reminder: ingatkan mahasiswa yang belum kirim
     laporan perkembangan, H-7 sebelum batasKirim
   - Lindungi semua endpoint dengan CRON_SECRET di header, dan buat idempoten
     supaya aman kalau cron jalan dobel

4. Komitmen yang lewat jatuh tempo lebih dari 30 hari otomatis berstatus MENUNGGAK,
   dan admin mendapat notifikasi. Mahasiswa penerima TIDAK BOLEH kehilangan status
   penerima karena ini — kekurangannya ditutup dari pool.

5. Notifikasi email lewat Resend, template Bahasa Indonesia
```

---

## Sesi 9 — Tema visual

Jalankan setelah Anda punya referensi visual UIKA. Prompt kasarnya:

```
Terapkan tema visual mengikuti https://uika-bogor.ac.id ke seluruh aplikasi.
Saya lampirkan screenshot sebagai acuan warna, tipografi, dan komponen.

Buat dulu design token di Tailwind config dan satu halaman /styleguide yang
menampilkan semua komponen dasar. Setelah saya setujui styleguide-nya, baru
terapkan ke halaman lain satu per satu.

Jangan ubah logika apa pun di sesi ini — murni presentasi.
```

---

## Sesi 10 — Deployment VPS

```
Siapkan deployment ke VPS UIKA untuk domain beasiswaota.uika-bogor.ac.id.
Buat semuanya di folder deploy/, jangan sentuh kode aplikasi.

1. Dockerfile multi-stage untuk Next.js standalone output, plus
   docker-compose.prod.yml berisi app, PostgreSQL, dan MinIO.
   Jangan expose port PostgreSQL dan MinIO ke publik — hanya ke jaringan internal
   compose. Yang boleh diakses dari luar hanya Nginx.

2. Konfigurasi Nginx sebagai reverse proxy:
   - HTTP redirect ke HTTPS
   - Security header: HSTS, X-Content-Type-Options, X-Frame-Options,
     Referrer-Policy, dan Content-Security-Policy yang sesuai dengan Next.js
   - Batas ukuran body 6MB, menyesuaikan batas upload berkas 5MB
   - Rate limit terpisah untuk /api/ dan untuk /login

3. Ecosystem file PM2 dengan nama proses beasiswaota, mode cluster,
   dan konfigurasi log rotation. Sertakan alternatif systemd unit file
   kalau ternyata tidak pakai Docker.

4. Systemd timer untuk ketiga endpoint cron, memanggil lewat curl dengan
   header CRON_SECRET.

5. Skrip deploy/backup.sh: pg_dump harian terenkripsi plus sinkronisasi
   bucket MinIO. Simpan ke lokasi di luar VPS aplikasi. Sertakan skrip
   restore dan instruksi mengujinya — backup yang belum pernah diuji restore
   bukan backup.

6. deploy/README.md berisi langkah setup dari VPS kosong sampai jalan:
   hardening dasar (SSH key only, disable root login, UFW, fail2ban),
   Certbot untuk beasiswaota.uika-bogor.ac.id, konfigurasi SPF/DKIM/DMARC
   untuk beasiswaota@uika-bogor.ac.id, lalu deploy aplikasi.

7. Checklist pra-produksi dalam bentuk markdown yang bisa dicentang, mencakup
   verifikasi environment variable, uji restore backup, uji webhook dengan
   sertifikat produksi, dan uji rate limit.

Jangan taruh secret apa pun di dalam repo. Semua lewat .env yang tidak
di-commit, dan .env.example hanya berisi nama variabel dengan nilai contoh.
```

---

## Catatan

**Kalau Claude Code mulai melebar** dari yang diminta, hentikan dengan Esc, `/clear`, lalu ulangi dengan prompt yang lebih sempit. Sesi yang kepanjangan akan menurunkan akurasinya.

**Sesi 5, 6, dan 7 adalah yang paling berisiko.** Sesi 5 dan 6 menyentuh uang; Sesi 7 menyentuh data pribadi mahasiswa. Jangan lanjut sebelum semua test di ketiganya hijau.

**Commit tiap sesi.** Kalau satu sesi menghasilkan sesuatu yang salah arah, `git reset` jauh lebih cepat daripada menjelaskan cara membatalkannya.

**Sebelum Sesi 6**, pastikan pengelola program sudah memutuskan: mode distribusi mana yang dipakai, dan apakah `Periode.nominalFull` seragam atau berbeda per prodi. Dua hal itu mengubah bentuk mesin alokasinya.
