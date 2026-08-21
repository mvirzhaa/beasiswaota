#!/usr/bin/env bash
# Backup harian: pg_dump terenkripsi (GPG symmetric) + mirror bucket MinIO,
# dikirim ke Google Drive (lokasi DI LUAR VPS ini) lewat rclone.
#
# WAJIB dikonfigurasi sebelum dipakai (lihat deploy/README.md):
#   - /etc/beasiswaota/backup.env berisi BACKUP_GPG_PASSPHRASE,
#     RCLONE_REMOTE, RCLONE_REMOTE_PATH, dan kredensial DB/MinIO
#   - `rclone config` sudah dijalankan sekali (otorisasi OAuth ke Google
#     Drive), menghasilkan remote dengan nama yang sama dengan
#     RCLONE_REMOTE di bawah
#   - `mc` (MinIO Client) sudah terpasang dan alias "beasiswaota" sudah
#     dikonfigurasi: mc alias set beasiswaota http://127.0.0.1:9000 <user> <pass>
#
# Jalankan via cron/systemd timer harian, mis. jam 02:00.
#
# INGAT: backup yang belum pernah dicoba restore BUKAN backup. Uji
# deploy/restore.sh secara berkala di lingkungan terpisah — lihat
# deploy/README.md bagian "Menguji restore".

set -euo pipefail

ENV_FILE="/etc/beasiswaota/backup.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE tidak ditemukan. Salin dari deploy/backup.env.example." >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

: "${BACKUP_GPG_PASSPHRASE:?BACKUP_GPG_PASSPHRASE wajib diisi}"
: "${RCLONE_REMOTE:?RCLONE_REMOTE wajib diisi (nama remote hasil rclone config)}"
: "${RCLONE_REMOTE_PATH:?RCLONE_REMOTE_PATH wajib diisi (folder tujuan di Google Drive)}"
: "${POSTGRES_USER:?POSTGRES_USER wajib diisi}"
: "${POSTGRES_DB:?POSTGRES_DB wajib diisi}"
: "${RETENSI_HARI:=14}"

TANGGAL="$(date +%Y-%m-%d_%H%M%S)"
STAGING="/var/backups/beasiswaota/$TANGGAL"
mkdir -p "$STAGING"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

trap 'log "GAGAL pada baris $LINENO — backup TIDAK lengkap, cek log di atas."' ERR

log "Mulai backup -> $STAGING"

# 1. pg_dump format custom (pg_restore-compatible), dari dalam container db.
log "Dump database $POSTGRES_DB..."
docker exec beasiswaota-db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc \
  > "$STAGING/db.dump"

# 2. Enkripsi dump dengan GPG symmetric (AES256).
log "Enkripsi dump..."
gpg --batch --yes --passphrase "$BACKUP_GPG_PASSPHRASE" --symmetric --cipher-algo AES256 \
  --output "$STAGING/db.dump.gpg" "$STAGING/db.dump"
rm -f "$STAGING/db.dump" # jangan simpan plaintext dump sama sekali

# 3. Mirror seluruh isi bucket MinIO ke staging (lewat S3 API, bukan akses
#    langsung ke volume Docker, supaya konsisten dengan apa yang benar-benar
#    aplikasi tulis/baca).
log "Mirror bucket MinIO..."
mkdir -p "$STAGING/minio"
mc mirror --quiet beasiswaota/"${MINIO_BUCKET:-beasiswaota-berkas}" "$STAGING/minio"

# 4. Kirim ke Google Drive (DI LUAR VPS ini) lewat rclone. Dump database
#    sudah terenkripsi GPG sebelum diunggah — isi bucket MinIO TIDAK
#    dienkripsi ulang di sini (mengandalkan enkripsi at-rest Google Drive
#    + akses akun terbatas), jadi jaga akun Google penyimpan backup ini
#    seketat mungkin (2FA, jangan dibagi).
log "Kirim ke $RCLONE_REMOTE:$RCLONE_REMOTE_PATH/$TANGGAL..."
rclone copy "$STAGING" "$RCLONE_REMOTE:$RCLONE_REMOTE_PATH/$TANGGAL" --transfers 4

# 5. Bersihkan staging lokal (data sensitif tidak perlu numpuk di VPS
#    aplikasi) dan backup remote yang lebih tua dari RETENSI_HARI.
log "Bersihkan staging lokal..."
rm -rf "$STAGING"
find /var/backups/beasiswaota -maxdepth 1 -type d -mtime "+${RETENSI_HARI}" -exec rm -rf {} \;
rclone delete --min-age "${RETENSI_HARI}d" "$RCLONE_REMOTE:$RCLONE_REMOTE_PATH" --rmdirs 2>/dev/null || true

log "Selesai. Backup tersimpan di $RCLONE_REMOTE:$RCLONE_REMOTE_PATH/$TANGGAL"
