# Cron via systemd timer

Aplikasi jalan di VPS (bukan Vercel), jadi cron dijalankan systemd timer, bukan Vercel Cron.

## Setup

```bash
# 1. Simpan secret di luar repo, HANYA readable oleh root.
sudo mkdir -p /etc/beasiswaota
sudo tee /etc/beasiswaota/cron.env > /dev/null <<'EOF'
CRON_SECRET=ganti-dengan-nilai-yang-sama-persis-dengan-.env-aplikasi
EOF
sudo chmod 600 /etc/beasiswaota/cron.env

# 2. Salin unit files.
sudo cp deploy/systemd/beasiswaota-cron-*.service deploy/systemd/beasiswaota-cron-*.timer /etc/systemd/system/

# 3. Aktifkan timer (bukan service-nya — service dipicu timer, Type=oneshot).
sudo systemctl daemon-reload
sudo systemctl enable --now beasiswaota-cron-jadwal-bayar.timer
sudo systemctl enable --now beasiswaota-cron-reminder.timer
sudo systemctl enable --now beasiswaota-cron-laporan-reminder.timer
sudo systemctl enable --now beasiswaota-cron-reminder-wa.timer
sudo systemctl enable --now beasiswaota-cron-laporan-semester.timer

# Cek jadwal & log.
systemctl list-timers | grep beasiswaota
journalctl -u beasiswaota-cron-reminder.service -n 50
```

Semua endpoint idempoten — aman kalau timer terpicu dobel (mis. restart
VPS di tengah jadwal). Ganti URL di tiap `.service` kalau domain berbeda dari
`beasiswaota.uika-bogor.ac.id` (lihat `env.APP_URL` di aplikasi).

`beasiswaota-cron-reminder-wa` mengirim pengingat WhatsApp untuk komitmen
berkelanjutan pada tanggal yang dipilih donatur sendiri saat mendaftar
(`Komitmen.tanggalPengingat`) — no-op aman selama `WA_API_URL`/`WA_API_TOKEN`
di `.env` aplikasi belum diisi (provider WA belum ditentukan).

`beasiswaota-cron-laporan-semester` mengecek harian apakah ada periode yang
baru dikunci admin (status SELESAI, biasanya sekitar April/Oktober) dan
belum pernah dikirimi notifikasi laporan — begitu ada, semua donatur yang
berkontribusi di periode itu dikirimi email + WA berisi tautan ke halaman
laporan penyaluran yang sudah ada. Idempoten lewat tabel `Pengaturan`, jadi
aman dijalankan harian meski periode baru ditutup sesekali saja.
