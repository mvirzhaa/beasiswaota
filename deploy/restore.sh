#!/usr/bin/env bash
# Restore dari hasil deploy/backup.sh. Dipakai untuk:
#   1. Pemulihan sungguhan setelah insiden.
#   2. UJI RESTORE BERKALA (wajib — backup yang belum pernah dicoba
#      restore bukan backup). Jalankan skrip ini di VPS/mesin TERPISAH
#      dengan container Postgres+MinIO kosong, BUKAN di server produksi,
#      supaya latihan restore tidak berisiko menimpa data hidup.
#
# Pemakaian:
#   ./restore.sh <path-folder-backup-hasil-rsync> <nama-container-db> <nama-container-minio>
#
# Contoh:
#   ./restore.sh /home/backup-user/beasiswaota/2026-08-20_020000 beasiswaota-db beasiswaota-minio

set -euo pipefail

BACKUP_DIR="${1:?Usage: restore.sh <path-folder-backup> <container-db> <container-minio>}"
DB_CONTAINER="${2:?Nama container Postgres tujuan wajib diisi}"
MINIO_CONTAINER="${3:?Nama container MinIO tujuan wajib diisi}"

if [[ ! -f "$BACKUP_DIR/db.dump.gpg" ]]; then
  echo "ERROR: $BACKUP_DIR/db.dump.gpg tidak ditemukan." >&2
  exit 1
fi

ENV_FILE="/etc/beasiswaota/backup.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE tidak ditemukan (butuh BACKUP_GPG_PASSPHRASE, POSTGRES_USER, POSTGRES_DB)." >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"
: "${BACKUP_GPG_PASSPHRASE:?}"
: "${POSTGRES_USER:?}"
: "${POSTGRES_DB:?}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

echo "=================================================================="
echo "  RESTORE ke container '$DB_CONTAINER' / '$MINIO_CONTAINER'"
echo "  Ini akan MENIMPA seluruh isi database dan bucket di container"
echo "  tersebut. Pastikan ini BUKAN container produksi kecuali memang"
echo "  sedang melakukan pemulihan insiden yang disengaja."
echo "=================================================================="
read -r -p "Ketik 'RESTORE' (huruf besar semua) untuk lanjut: " KONFIRMASI
if [[ "$KONFIRMASI" != "RESTORE" ]]; then
  echo "Dibatalkan."
  exit 1
fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

log "Dekripsi dump database..."
gpg --batch --yes --passphrase "$BACKUP_GPG_PASSPHRASE" --decrypt \
  --output "$WORKDIR/db.dump" "$BACKUP_DIR/db.dump.gpg"

log "Restore database ke container $DB_CONTAINER (drop + recreate isi $POSTGRES_DB)..."
docker exec -i "$DB_CONTAINER" pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --clean --if-exists --no-owner < "$WORKDIR/db.dump"

if [[ -d "$BACKUP_DIR/minio" ]]; then
  log "Restore bucket MinIO lewat mc mirror..."
  mc mirror --quiet --overwrite "$BACKUP_DIR/minio" beasiswaota/"${MINIO_BUCKET:-beasiswaota-berkas}"
else
  log "PERINGATAN: $BACKUP_DIR/minio tidak ada, lewati restore berkas MinIO."
fi

log "Restore selesai. WAJIB verifikasi manual: login, buka satu berkas privat,"
log "cek jumlah baris beberapa tabel kunci (users, transaksi, alokasi)."
