# Deployment — beasiswaota.uika-bogor.ac.id

Panduan dari VPS kosong sampai aplikasi jalan. Ikuti berurutan — tiap
bagian mengasumsikan bagian sebelumnya sudah selesai.

Catatan koneksi: kalau VPS ini pakai port SSH kustom (bukan 22 default,
mis. di-forward lewat NAT ke 22 internal), tambahkan `-p <port>` di setiap
perintah `ssh`/`scp` di bawah — dan ingat aturan UFW harus mengizinkan
port **internal** yang benar-benar didengarkan `sshd` (cek dengan
`grep -i "^Port" /etc/ssh/sshd_config`, biasanya tetap `22` meski port
eksternal/NAT-nya beda), bukan port eksternal itu sendiri.

Panduan ini ditulis untuk dijalankan sebagai **root langsung** (bukan
user non-root terpisah) dan menaruh kode di `/var/www/html/beasiswaota` —
sesuaikan path kalau susunan VPS Anda beda.

---

## 0. Prasyarat

- VPS Ubuntu 22.04/24.04 LTS, akses root.
- DNS: satu A record `beasiswaota.uika-bogor.ac.id` mengarah ke IP VPS.
  Bucket MinIO diproxy lewat path (`/beasiswaota-berkas/`) di domain yang
  sama — lihat catatan di `deploy/nginx/beasiswaota.conf` — jadi tidak
  perlu subdomain/sertifikat kedua kalau memang cuma satu domain yang
  disediakan.
- Kredensial VPS, domain, dan email `beasiswaota@uika-bogor.ac.id` sudah
  di tangan (jangan simpan di repo ini dalam bentuk apa pun).

---

## 1. Hardening dasar VPS

Sebagai root:

```bash
# Firewall — WAJIB izinkan port SSH yang BENAR-BENAR didengarkan sshd
# (cek dulu: grep -i "^Port" /etc/ssh/sshd_config, default 22) sebelum
# ufw enable, atau Anda bisa terkunci dari VPS sendiri.
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# fail2ban untuk SSH
apt update && apt install -y fail2ban
systemctl enable --now fail2ban
```

Kalau root login masih pakai password (bukan SSH key), pertimbangkan
ganti ke key-only (`PasswordAuthentication no` di
`/etc/ssh/sshd_config`, lalu `systemctl restart sshd`) — tapi **jangan
tutup sesi SSH yang sedang aktif sebelum mengonfirmasi key-based login
berhasil dari sesi terpisah**, supaya tidak terkunci kalau ada salah
konfigurasi.

---

## 2. Docker

```bash
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version
```

---

## 3. Ambil kode & siapkan .env

```bash
mkdir -p /var/www/html/beasiswaota
git clone https://github.com/mvirzhaa/beasiswaota.git /var/www/html/beasiswaota
cd /var/www/html/beasiswaota

cp deploy/.env.production.example .env
nano .env   # isi semua nilai GANTI_*/isi_* dengan nilai asli
chmod 600 .env
```

`AUTH_SECRET` baru: `openssl rand -base64 32`.
`CRON_SECRET` baru: `openssl rand -hex 24`.

---

## 4. Sertifikat TLS

Dua opsi, tergantung sertifikat yang Anda punya:

**A. Sudah ada sertifikat (mis. wildcard dari CA kampus/komersial).**
Susun jadi `fullchain.pem` (leaf cert + intermediate, urutan dari yang
paling spesifik ke paling umum, TANPA root CA) dan `privkey.pem`, lalu:

```bash
mkdir -p /etc/letsencrypt/live/beasiswaota.uika-bogor.ac.id
# upload fullchain.pem + privkey.pem ke situ (scp dari laptop Anda),
# lalu:
chmod 600 /etc/letsencrypt/live/beasiswaota.uika-bogor.ac.id/privkey.pem
```

Nginx juga butuh `/etc/letsencrypt/options-ssl-nginx.conf` dan
`ssl-dhparam.pem` (dipakai bareng, bukan per-domain) — kalau belum ada
karena tidak pernah menjalankan Certbot sama sekali, generate manual
(isi `options-ssl-nginx.conf` di bawah adalah default Certbot sendiri —
ditulis langsung, bukan di-download dari luar, supaya tidak bergantung
ke ketersediaan/perubahan URL pihak ketiga):

```bash
mkdir -p /etc/letsencrypt

cat > /etc/letsencrypt/options-ssl-nginx.conf <<'EOF'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
EOF

openssl dhparam -out /etc/letsencrypt/ssl-dhparam.pem 2048
```

`openssl dhparam` butuh 1–3 menit (kadang lebih lama di VPS dengan CPU
terbatas) — itu normal, tunggu sampai kembali ke prompt.

**B. Belum ada sertifikat — pakai Certbot (Let's Encrypt), gratis.**

```bash
apt install -y nginx certbot
systemctl stop nginx 2>/dev/null
certbot certonly --standalone -d beasiswaota.uika-bogor.ac.id
mkdir -p /var/www/certbot
```

Ini otomatis membuat `fullchain.pem`/`privkey.pem` DAN file bersama
`options-ssl-nginx.conf`/`ssl-dhparam.pem` sekaligus.

Perpanjangan otomatis kalau pakai Certbot (Let's Encrypt kedaluwarsa tiap
90 hari; sertifikat CA komersial biasanya manual, catat tanggal
kedaluwarsanya): `systemctl list-timers | grep certbot`. Tambahkan hook
reload Nginx kalau belum ada:

```bash
echo 'systemctl reload nginx' | tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

---

## 5. Nginx

```bash
apt install -y nginx   # kalau belum ter-install dari langkah 4
cp deploy/nginx/beasiswaota.conf /etc/nginx/sites-available/beasiswaota.conf
cp deploy/nginx/proxy_params_beasiswaota /etc/nginx/proxy_params_beasiswaota
ln -s /etc/nginx/sites-available/beasiswaota.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t   # WAJIB lolos sebelum lanjut
systemctl start nginx
systemctl enable nginx
```

---

## 6. Jalankan aplikasi — pilih SATU jalur

### Jalur A: semuanya di Docker (direkomendasikan, paling sedikit moving parts)

```bash
cd /var/www/html/beasiswaota
docker compose --env-file .env -f deploy/docker-compose.prod.yml -p beasiswaota up -d db minio
docker compose --env-file .env -f deploy/docker-compose.prod.yml -p beasiswaota run --rm migrate
docker compose --env-file .env -f deploy/docker-compose.prod.yml -p beasiswaota up -d app
```

Rilis baru:

```bash
git pull
docker compose --env-file .env -f deploy/docker-compose.prod.yml -p beasiswaota build app migrate
docker compose --env-file .env -f deploy/docker-compose.prod.yml -p beasiswaota run --rm migrate
docker compose --env-file .env -f deploy/docker-compose.prod.yml -p beasiswaota up -d app
```

### Jalur B: PM2 native (db & MinIO tetap Docker, hanya Next.js native)

Sesuai CLAUDE.md ("Proses Next.js dijalankan lewat PM2 dengan nama proses
`beasiswaota`") kalau tim ops lebih familiar PM2 daripada mengelola image
Docker aplikasi.

```bash
docker compose --env-file .env -f deploy/docker-compose.prod.yml -p beasiswaota up -d db minio
# .env untuk jalur ini pakai DATABASE_URL 127.0.0.1:5433 (bukan "db") dan
# MINIO_ENDPOINT tetap domain publik seperti di .env.production.example
# (bukan nama service Docker "db"/"minio" — itu hanya berlaku dari DALAM
# jaringan compose, bukan dari proses native di host).

npm install -g pm2
cd /var/www/html/beasiswaota
npm ci
npx prisma migrate deploy
npm run build

pm2 start deploy/pm2/ecosystem.config.js
pm2 save
pm2 startup   # ikuti instruksi yang ditampilkan

pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 20M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
```

Kalau PM2 tidak tersedia/tidak diinginkan sama sekali, `deploy/systemd/beasiswaota.service`
adalah alternatifnya — sesuaikan `User=`/`WorkingDirectory=` (ke
`/var/www/html/beasiswaota`) lalu:

```bash
cp deploy/systemd/beasiswaota.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now beasiswaota.service
```

---

## 7. Cron (systemd timer)

Ketiga endpoint cron (Sesi 8) dilindungi `CRON_SECRET`. Setup lengkap ada
di `deploy/systemd/README.md` — ringkasnya:

```bash
mkdir -p /etc/beasiswaota
echo "CRON_SECRET=$(grep ^CRON_SECRET /var/www/html/beasiswaota/.env | cut -d= -f2)" \
  | tee /etc/beasiswaota/cron.env
chmod 600 /etc/beasiswaota/cron.env

cp deploy/systemd/beasiswaota-cron-*.service deploy/systemd/beasiswaota-cron-*.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now beasiswaota-cron-jadwal-bayar.timer
systemctl enable --now beasiswaota-cron-reminder.timer
systemctl enable --now beasiswaota-cron-laporan-reminder.timer
```

---

## 8. Email: SPF, DKIM, DMARC untuk beasiswaota@uika-bogor.ac.id

Ini diatur di DNS zone `uika-bogor.ac.id`, dikoordinasikan dengan admin
domain UIKA (biasanya bukan Anda sendiri yang pegang akses DNS utama):

- **SPF** (TXT di `uika-bogor.ac.id`): tambahkan `include:` penyedia
  pengirim email Resend ke record SPF yang sudah ada — JANGAN buat record
  SPF kedua, gabungkan ke satu TXT SPF yang sama. Nilai include: yang tepat
  ada di dashboard Resend saat menambahkan domain pengirim.
- **DKIM**: tambahkan domain `uika-bogor.ac.id` (atau subdomain khusus
  pengirim kalau tim IT UIKA lebih suka begitu) di dashboard Resend, lalu
  tambahkan record CNAME/TXT DKIM yang diberikan Resend ke DNS.
- **DMARC** (TXT `_dmarc.uika-bogor.ac.id`): mulai dari kebijakan longgar
  dulu untuk mengamati, baru diperketat:
  `v=DMARC1; p=none; rua=mailto:beasiswaota@uika-bogor.ac.id`
  Setelah yakin SPF/DKIM semua email dari domain ini lolos, naikkan
  `p=none` -> `p=quarantine` -> `p=reject`.

Verifikasi status di dashboard Resend sebelum mengandalkan pengiriman
produksi (reminder, notifikasi akun) — kalau DNS ini belum beres, email
tetap "terkirim" dari sisi aplikasi (`kirimEmail()` sukses ke API Resend)
tapi bisa masuk spam atau ditolak penerima.

---

## 9. Verifikasi webhook Midtrans

1. Isi `MIDTRANS_SERVER_KEY`/`MIDTRANS_CLIENT_KEY` produksi di `.env`,
   `MIDTRANS_IS_PRODUCTION=true`.
2. Di dashboard Midtrans, set Payment Notification URL ke
   `https://beasiswaota.uika-bogor.ac.id/api/webhook/payment`.
3. Lakukan satu transaksi kecil sungguhan (atau pakai simulator Midtrans
   kalau tersedia untuk akun produksi), lalu cek:
   - `AuditLog` punya baris `transaksi.webhook_verifikasi`.
   - `DanaLedger` bertambah sesuai nominal.
   - Endpoint TIDAK bisa dipanggil tanpa `signature_key` valid (uji kirim
     payload dengan signature acak lewat curl, harus dapat 401).

---

## 10. Backup

Lihat komentar lengkap di `deploy/backup.sh` dan `deploy/restore.sh`.
Ringkas:

```bash
mkdir -p /etc/beasiswaota
cp deploy/backup.env.example /etc/beasiswaota/backup.env
nano /etc/beasiswaota/backup.env   # isi passphrase GPG, host remote, dst
chmod 600 /etc/beasiswaota/backup.env

# Perlu: mc (MinIO Client), gpg, rsync sudah terpasang, dan SSH key
# passwordless ke BACKUP_REMOTE_HOST sudah disiapkan.
apt install -y gpg rsync
curl https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
chmod +x /usr/local/bin/mc
mc alias set beasiswaota http://127.0.0.1:9000 <MINIO_ROOT_USER> <MINIO_ROOT_PASSWORD>
```

Jadwalkan harian lewat cron sistem (bukan systemd timer aplikasi, supaya
independen kalau ada masalah di sisi app):

```bash
echo "0 2 * * * root /var/www/html/beasiswaota/deploy/backup.sh >> /var/log/beasiswaota-backup.log 2>&1" \
  | tee /etc/cron.d/beasiswaota-backup
```

### Menguji restore

**Wajib dilakukan minimal sekali sebelum go-live, dan berkala (mis. tiap
kuartal) setelahnya.** Backup yang belum pernah dicoba restore bukan
backup:

1. Siapkan VPS/mesin terpisah (bukan produksi) dengan
   `docker compose --env-file .env -f deploy/docker-compose.prod.yml -p beasiswaota up -d db minio`
   memakai `.env` KOSONG/baru (bukan salinan data produksi).
2. `rsync` salah satu folder backup dari `BACKUP_REMOTE_HOST` ke mesin uji.
3. `./deploy/restore.sh <folder-backup> beasiswaota-db beasiswaota-minio`
4. Nyalakan app mengarah ke db/minio uji ini, login, cek beberapa berkas
   privat bisa dibuka dan datanya masuk akal.
5. Catat waktu yang dibutuhkan (RTO) — ini yang dilaporkan ke pengelola
   program kalau ditanya "berapa lama pulih kalau ada insiden".

---

## 11. Update kode (ringkasan)

Docker: lihat langkah "Rilis baru" di bagian 6 Jalur A.
PM2/systemd native: `git pull && npm ci && npx prisma migrate deploy && npm run build`,
lalu `pm2 reload beasiswaota` atau `systemctl restart beasiswaota`.

Setelah tiap update yang mengubah dependency native (`argon2`, dst) atau
`prisma/schema.prisma`, jalankan `npx tsc --noEmit` dan `npm run test`
LOKAL dulu sebelum deploy — bukan langsung coba-coba di produksi.

---

## 12. Troubleshooting

### App container segfault berulang ("Empty reply from server")

Gejala: `docker logs beasiswaota-app` cuma menampilkan banner startup
Next.js berulang-ulang tanpa error, container terus restart
(`RestartCount` naik), dan request ke `http://127.0.0.1:3000` selalu
dapat "Empty reply from server". Konfirmasi lewat:

```bash
dmesg -T | grep -i segfault
cat /proc/cpuinfo | grep -m1 flags | tr ' ' '\n' | grep -E "^(avx2|bmi2)$"
```

**Akar masalah sebenarnya (ditemukan lewat isolasi bertahap di VPS
produksi): bug di package `argon2@0.45.1` sendiri, BUKAN CPU/Node/V8
secara umum.** Kronologi penemuannya, supaya tidak perlu diulang dari
nol kalau muncul lagi di lingkungan lain:

1. `dmesg` awalnya menunjukkan `next-server ... segfault at a0 ... in
   node[...]`, dan `/proc/cpuinfo` waktu itu memang tidak menampilkan
   `avx2`/`bmi2` (VM ini terpasang dengan tipe CPU virtual "QEMU Virtual
   CPU version 2.5+" — sangat lama/generik). Ini terlihat sangat
   meyakinkan sebagai penyebabnya.
2. Tim IT mengganti tipe CPU VM ke yang mendukung AVX2/BMI2 (perbaikan
   yang tetap benar dan tetap perlu dilakukan — lihat di bawah) — **tapi
   crash tetap terjadi persis sama** setelah itu.
3. `NODE_OPTIONS=--jitless` (matikan JIT V8) dan downgrade ke Node
   20.11.1 SAMA-SAMA tidak menyelesaikan — crash tetap di offset yang
   nyaris sama.
4. Isolasi langsung: server HTTP polos (`http.createServer`) dan
   `fetch()` di image `node:20-bookworm-slim` biasa **tidak crash** di
   VPS yang sama. Tapi memanggil `require('argon2').hash(...)` sendirian
   (tanpa Next.js/Prisma sama sekali) **selalu crash** dengan tanda
   tangan yang identik.
5. Sebagai pembanding, Prisma (juga native binding lewat N-API) berhasil
   connect+auth+query ke Postgres tanpa crash sama sekali di VPS yang
   sama — jadi bukan soal "semua native N-API addon" bermasalah,
   spesifik ke `argon2`.
6. Downgrade `argon2` dari `^0.45.1` ke `0.31.2` (`npm install
   argon2@0.31.2`, commit `d7f630e`) — **menyelesaikan crash-nya.**
   `argon2.hash()` sukses, `app` jalan normal, `curl` dapat `200 OK`.

**Pelajaran:** kalau crash serupa muncul lagi, JANGAN langsung asumsikan
itu soal CPU/AVX2 hanya karena `cpuinfo` kebetulan tidak lengkap saat
itu — isolasi dulu satu per satu modul native yang dipakai (argon2,
Prisma, dll) lewat `docker run --entrypoint node ... -e "require(...)"`
sebelum menyimpulkan akar masalahnya di level infrastruktur.

**Catatan sampingan:** `argon2@0.31.2` memakai toolchain build
(`@mapbox/node-pre-gyp`) yang menarik versi `tar` lama dengan kerentanan
`critical` (hanya dipakai saat instalasi/build, tidak di runtime
produksi — lihat `npm audit`). Kalau ada waktu, cek apakah versi argon2
yang lebih baru dari 0.31.2 (tapi lebih lama dari 0.45.1 yang bermasalah)
juga menyelesaikan crash tanpa menarik toolchain lama ini.

**Perbaikan CPU (tetap dilakukan, dan tetap dianjurkan meski bukan akar
masalah crash ini):** minta pengelola VM (tim IT/penyedia VPS) mengganti
tipe CPU virtual lewat panel hypervisor (Proxmox/VMware/dst) ke `host`
(passthrough) atau minimal model `Haswell` ke atas. Perlu VM di-restart
dari panel (bukan cuma reboot dari dalam OS) supaya berlaku. Verifikasi:

```bash
cat /proc/cpuinfo | grep -m1 flags | tr ' ' '\n' | grep -E "^(avx2|bmi2)$"
# harus muncul "avx2"
```
