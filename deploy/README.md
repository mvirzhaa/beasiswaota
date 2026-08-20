# Deployment — beasiswaota.uika-bogor.ac.id

Panduan dari VPS kosong sampai aplikasi jalan. Ikuti berurutan — tiap
bagian mengasumsikan bagian sebelumnya sudah selesai.

Catatan koneksi: kalau VPS ini pakai port SSH kustom (bukan 22 default),
tambahkan `-p <port>` di setiap perintah `ssh`/`scp` di bawah sesuai info
provisioning VPS yang Anda terima dari penyedia — cek dulu port mana yang
sebenarnya dibuka sebelum mulai, jangan asumsikan 22.

---

## 0. Prasyarat

- VPS Ubuntu 22.04/24.04 LTS, akses root awal.
- DNS: **dua** A record mengarah ke IP VPS:
  - `beasiswaota.uika-bogor.ac.id` — aplikasi
  - `storage.beasiswaota.uika-bogor.ac.id` — proxy MinIO (lihat catatan di
    `deploy/nginx/beasiswaota.conf` kenapa ini perlu subdomain terpisah,
    bukan cuma path)
- Kredensial VPS, domain, dan email `beasiswaota@uika-bogor.ac.id` sudah
  di tangan (jangan simpan di repo ini dalam bentuk apa pun).

---

## 1. Hardening dasar VPS

Login pertama kali sebagai root, lalu:

```bash
# Buat user non-root untuk operasional sehari-hari.
adduser beasiswaota
usermod -aG sudo beasiswaota

# Salin SSH key Anda ke user baru (dari mesin lokal):
#   ssh-copy-id -p <port-ssh> beasiswaota@<ip-vps>

# --- Sebagai root, matikan login password & root SSH ---
nano /etc/ssh/sshd_config
#   PasswordAuthentication no
#   PermitRootLogin no
systemctl restart sshd

# --- Firewall (UFW) ---
ufw default deny incoming
ufw default allow outgoing
ufw allow <port-ssh>/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# --- fail2ban untuk SSH ---
apt update && apt install -y fail2ban
systemctl enable --now fail2ban
```

Login ulang sebagai `beasiswaota` untuk semua langkah berikutnya — jangan
lagi pakai root kecuali benar-benar perlu (`sudo` saja).

---

## 2. Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker beasiswaota
# logout/login lagi supaya grup docker aktif
docker --version && docker compose version
```

---

## 3. Ambil kode & siapkan .env

```bash
sudo mkdir -p /opt/beasiswaota/shared
sudo chown -R beasiswaota:beasiswaota /opt/beasiswaota

git clone <url-repo-git-anda> /opt/beasiswaota/current
cd /opt/beasiswaota/current

cp deploy/.env.production.example /opt/beasiswaota/shared/.env
nano /opt/beasiswaota/shared/.env   # isi semua nilai GANTI_* dan kunci asli
chmod 600 /opt/beasiswaota/shared/.env

ln -s /opt/beasiswaota/shared/.env /opt/beasiswaota/current/.env
```

`AUTH_SECRET` baru: `openssl rand -base64 32`.
`CRON_SECRET` baru: `openssl rand -hex 24`.

---

## 4. Certbot (TLS) — untuk KEDUA domain

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Nginx belum ada config beasiswaota, jadi pakai mode standalone dulu:
sudo systemctl stop nginx
sudo certbot certonly --standalone \
  -d beasiswaota.uika-bogor.ac.id \
  -d storage.beasiswaota.uika-bogor.ac.id

sudo mkdir -p /var/www/certbot
```

Certbot menaruh sertifikat di `/etc/letsencrypt/live/<domain>/` — kedua
domain di atas dipakai persis di `deploy/nginx/beasiswaota.conf`.

Perpanjangan otomatis (systemd timer certbot sudah terpasang bawaan paket
Ubuntu, cek): `systemctl list-timers | grep certbot`. Tambahkan hook reload
Nginx setelah renew kalau belum ada:

```bash
echo 'systemctl reload nginx' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

---

## 5. Nginx

```bash
sudo cp deploy/nginx/beasiswaota.conf /etc/nginx/sites-available/beasiswaota.conf
sudo cp deploy/nginx/proxy_params_beasiswaota /etc/nginx/proxy_params_beasiswaota
sudo ln -s /etc/nginx/sites-available/beasiswaota.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t   # WAJIB lolos sebelum lanjut
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 6. Jalankan aplikasi — pilih SATU jalur

### Jalur A: semuanya di Docker (direkomendasikan, paling sedikit moving parts)

```bash
cd /opt/beasiswaota/current
docker compose -f deploy/docker-compose.prod.yml up -d db minio
docker compose -f deploy/docker-compose.prod.yml run --rm migrate
docker compose -f deploy/docker-compose.prod.yml up -d app
```

Rilis baru:

```bash
git pull
docker compose -f deploy/docker-compose.prod.yml build app migrate
docker compose -f deploy/docker-compose.prod.yml run --rm migrate
docker compose -f deploy/docker-compose.prod.yml up -d app
```

### Jalur B: PM2 native (db & MinIO tetap Docker, hanya Next.js native)

Sesuai CLAUDE.md ("Proses Next.js dijalankan lewat PM2 dengan nama proses
`beasiswaota`") kalau tim ops lebih familiar PM2 daripada mengelola image
Docker aplikasi.

```bash
docker compose -f deploy/docker-compose.prod.yml up -d db minio
# .env untuk jalur ini pakai DATABASE_URL 127.0.0.1:5433 dan
# MINIO tetap domain publik seperti di .env.production.example (bukan
# nama service Docker "db"/"minio" — itu hanya berlaku dari DALAM
# jaringan compose, bukan dari proses native di host).

sudo npm install -g pm2
cd /opt/beasiswaota/current
npm ci
npx prisma migrate deploy
npm run build

pm2 start deploy/pm2/ecosystem.config.js
pm2 save
pm2 startup   # ikuti instruksi yang ditampilkan (jalankan sebagai root)

pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 20M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
```

Kalau PM2 tidak tersedia/tidak diinginkan sama sekali, `deploy/systemd/beasiswaota.service`
adalah alternatifnya — sesuaikan `User=`/`WorkingDirectory=` lalu:

```bash
sudo cp deploy/systemd/beasiswaota.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now beasiswaota.service
```

---

## 7. Cron (systemd timer)

Ketiga endpoint cron (Sesi 8) dilindungi `CRON_SECRET`. Setup lengkap ada
di `deploy/systemd/README.md` — ringkasnya:

```bash
sudo mkdir -p /etc/beasiswaota
echo "CRON_SECRET=$(grep ^CRON_SECRET /opt/beasiswaota/shared/.env | cut -d= -f2)" \
  | sudo tee /etc/beasiswaota/cron.env
sudo chmod 600 /etc/beasiswaota/cron.env

sudo cp deploy/systemd/beasiswaota-cron-*.service deploy/systemd/beasiswaota-cron-*.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now beasiswaota-cron-jadwal-bayar.timer
sudo systemctl enable --now beasiswaota-cron-reminder.timer
sudo systemctl enable --now beasiswaota-cron-laporan-reminder.timer
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
sudo mkdir -p /etc/beasiswaota
sudo cp deploy/backup.env.example /etc/beasiswaota/backup.env
sudo nano /etc/beasiswaota/backup.env   # isi passphrase GPG, host remote, dst
sudo chmod 600 /etc/beasiswaota/backup.env

# Perlu: mc (MinIO Client), gpg, rsync sudah terpasang, dan SSH key
# passwordless ke BACKUP_REMOTE_HOST sudah disiapkan.
sudo apt install -y gpg rsync
curl https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
sudo chmod +x /usr/local/bin/mc
mc alias set beasiswaota http://127.0.0.1:9000 <MINIO_ROOT_USER> <MINIO_ROOT_PASSWORD>
```

Jadwalkan harian lewat cron sistem (bukan systemd timer aplikasi, supaya
independen kalau ada masalah di sisi app):

```bash
echo "0 2 * * * beasiswaota /opt/beasiswaota/current/deploy/backup.sh >> /var/log/beasiswaota-backup.log 2>&1" \
  | sudo tee /etc/cron.d/beasiswaota-backup
```

### Menguji restore

**Wajib dilakukan minimal sekali sebelum go-live, dan berkala (mis. tiap
kuartal) setelahnya.** Backup yang belum pernah dicoba restore bukan
backup:

1. Siapkan VPS/mesin terpisah (bukan produksi) dengan
   `docker compose -f deploy/docker-compose.prod.yml up -d db minio`
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
