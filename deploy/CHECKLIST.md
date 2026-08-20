# Checklist pra-produksi — beasiswaota.uika-bogor.ac.id

Centang manual sebelum mengumumkan sistem ini ke pengguna sungguhan
(mahasiswa/donatur). Jangan skip bagian mana pun demi kecepatan — ini
sistem yang menangani uang dan data pribadi.

## Environment variables

- [ ] `/opt/beasiswaota/shared/.env` berisi nilai ASLI, bukan placeholder
      `GANTI_*`/`isi_*` dari `deploy/.env.production.example`.
- [ ] `AUTH_SECRET` di-generate baru untuk produksi (`openssl rand -base64 32`),
      BUKAN disalin dari `.env` development.
- [ ] `CRON_SECRET` di-generate baru untuk produksi, berbeda dari development.
- [ ] `APP_URL=https://beasiswaota.uika-bogor.ac.id` (bukan `http://`, bukan
      IP, bukan `localhost`).
- [ ] `MAIL_FROM=beasiswaota@uika-bogor.ac.id` (akun asli, bukan dummy).
- [ ] `MIDTRANS_IS_PRODUCTION=true` dan server/client key adalah key
      **produksi** Midtrans, bukan sandbox.
- [ ] `MINIO_ENDPOINT=beasiswaota.uika-bogor.ac.id`,
      `MINIO_PORT=443`, `MINIO_USE_SSL=true` — bukan `minio`/`localhost`.
- [ ] File `.env` berizin `600`, dimiliki user aplikasi, dan **tidak**
      pernah ter-commit ke git (`git status` di root repo bersih).
- [ ] `POSTGRES_PASSWORD` dan `MINIO_ROOT_PASSWORD` bukan nilai contoh dari
      file `.example`.

## Build & kode

- [ ] `npx tsc --noEmit` bersih di commit yang akan di-deploy.
- [ ] `npm run test` (vitest) semua lolos.
- [ ] `npm run build` / image Docker `runner` berhasil dibuat tanpa error.
- [ ] `next.config.ts` masih punya `output: "standalone"` (dicek — kalau
      ini hilang, image Docker `runner` tidak akan punya `server.js`).

## Infrastruktur

- [ ] `docker compose -f deploy/docker-compose.prod.yml config` tidak
      error (validasi syntax + interpolasi env).
- [ ] Tidak ada port aplikasi/db/minio yang ter-bind ke `0.0.0.0` — semua
      lewat `127.0.0.1:...` di `docker-compose.prod.yml`, cek dengan
      `docker compose ... ps` dan `ss -tlnp` dari VPS.
- [ ] `nginx -t` lolos, dan location `/beasiswaota-berkas/` untuk proxy
      MinIO ada di server block yang aktif.
- [ ] Sertifikat TLS valid untuk `beasiswaota.uika-bogor.ac.id`
      (`curl -vI https://beasiswaota.uika-bogor.ac.id` tidak menunjukkan
      warning sertifikat).
- [ ] Kalau pakai Certbot: auto-renew aktif
      (`systemctl list-timers | grep certbot`) dan hook reload Nginx
      terpasang. Kalau pakai sertifikat CA komersial manual: tanggal
      kedaluwarsa dicatat dan diingatkan sebelum jatuh tempo.
- [ ] UFW aktif dan mengizinkan port SSH **internal** yang benar-benar
      didengarkan `sshd` (cek `grep -i "^Port" /etc/ssh/sshd_config`,
      biasanya `22` meskipun ada port eksternal/NAT yang berbeda) plus
      80/443 (`ufw status`).
- [ ] `PermitRootLogin no` dan `PasswordAuthentication no` di
      `/etc/ssh/sshd_config`.
- [ ] fail2ban aktif untuk jail SSH.

## Backup & restore

- [ ] `deploy/backup.sh` sudah dijalankan minimal sekali secara manual dan
      berhasil sampai selesai tanpa error.
- [ ] Cron/systemd timer harian untuk `backup.sh` terpasang dan tercatat
      di log setelah jalan otomatis pertama kali.
- [ ] **Uji restore sungguhan** sudah dilakukan di lingkungan TERPISAH
      (bukan produksi) sesuai `deploy/README.md` bagian "Menguji restore":
      - [ ] Database berhasil di-restore dan bisa di-query.
      - [ ] Bucket MinIO berhasil di-mirror balik, satu berkas privat
            dicoba dibuka dan cocok isinya.
      - [ ] Waktu pemulihan (RTO) dicatat dan dilaporkan ke pengelola
            program.
- [ ] `BACKUP_REMOTE_HOST` benar-benar mesin **di luar** VPS aplikasi ini
      (bukan folder lain di VPS yang sama).
- [ ] `BACKUP_GPG_PASSPHRASE` tersimpan di password manager terpisah, bukan
      hanya di `/etc/beasiswaota/backup.env`.

## Email

- [ ] SPF, DKIM, DMARC untuk domain pengirim sudah dikonfigurasi (lihat
      `deploy/README.md` bagian 8) dan diverifikasi lolos di dashboard
      Resend (status domain: verified, bukan pending).
- [ ] Kirim email uji sungguhan (reminder atau notifikasi akun) ke inbox
      Gmail/Outlook nyata — cek TIDAK masuk folder spam.
- [ ] Header email uji menunjukkan `SPF: PASS` dan `DKIM: PASS` (cek lewat
      "Show original"/"View source" di klien email).

## Webhook payment gateway

- [ ] Payment Notification URL di dashboard Midtrans produksi mengarah ke
      `https://beasiswaota.uika-bogor.ac.id/api/webhook/payment` (domain
      HTTPS dengan sertifikat valid, bukan IP/staging).
- [ ] Transaksi uji nyata (nominal kecil) berhasil: status berubah di DB,
      `AuditLog` mencatat event webhook, `DanaLedger`/pool bertambah sesuai
      nominal.
- [ ] Endpoint webhook menolak (401/403) payload dengan `signature_key`
      yang salah/acak — diuji manual dengan `curl`.
- [ ] Endpoint webhook idempoten: mengirim notifikasi sukses yang sama dua
      kali tidak mendobelkan `Transaksi`/`AlokasiSumber`.

## Rate limiting

- [ ] Zona `beasiswaota_login` (5r/m) aktif — uji: >5 percobaan login
      cepat dari IP yang sama mendapat respons dibatasi (429/503), bukan
      diproses semua.
- [ ] Zona `beasiswaota_api` (60r/m) aktif untuk `/api/` — diuji serupa
      dengan permintaan beruntun.
- [ ] Setelah uji rate-limit, pastikan IP penguji tidak ke-ban permanen di
      fail2ban/firewall lain (kalau ada aturan tambahan di luar Nginx).

## RBAC & data sensitif (spot check manual di produksi, bukan cuma dev)

- [ ] Login sebagai MAHASISWA, coba akses URL pengajuan mahasiswa lain
      langsung by ID — harus 403/404, bukan menampilkan data.
- [ ] Login sebagai ORTU_ASUH, cek payload halaman mahasiswa binaan yang
      `persetujuanMahasiswa` masih `false` — pastikan tidak ada nomor HP/
      email/alamat mahasiswa yang terkirim ke browser (cek Network tab,
      bukan cuma tampilan UI).
- [ ] Coba akses URL berkas (SKTM/slip gaji/foto rumah) langsung tanpa
      lewat aplikasi — harus gagal (bukan URL publik MinIO).
- [ ] Signed URL berkas kedaluwarsa setelah ~5 menit (coba buka link lama
      dari tab yang sudah lama tidak refresh).

## Operasional

- [ ] Cron systemd timer (jadwal-bayar, reminder, laporan-reminder) aktif
      dan `systemctl status` semuanya `active`.
- [ ] PM2 (`pm2 startup` + `pm2 save`) atau systemd unit aplikasi aktif
      otomatis setelah VPS reboot — uji dengan reboot terkontrol kalau
      memungkinkan sebelum go-live.
- [ ] Log aplikasi (PM2 logs / `docker compose logs app`) tidak berisi
      stack trace berulang saat idle.
- [ ] Kontak person untuk insiden (siapa yang dihubungi kalau sistem down
      di luar jam kerja) sudah disepakati dengan pengelola program.

## Setelah semua di atas tercentang

- [ ] Buat akun admin produksi pertama (bukan seed dummy), catat siapa
      pemegangnya.
- [ ] Nonaktifkan/hapus akun dummy seed development kalau sempat ikut ter-
      migrate ke produksi (harusnya tidak, tapi cek `SELECT email FROM
      "User"` sekali).
- [ ] Informasikan ke pengelola program (kontak yang tercantum di footer)
      bahwa sistem siap dipakai menggantikan Google Form.
