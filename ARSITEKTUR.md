# ARSITEKTUR.md

Dokumen acuan struktur folder, peta endpoint, dan urutan pembangunan untuk Sistem
Beasiswa Orangtua Asuh UIKA. Dibuat di Sesi 0, jadi rujukan untuk sesi berikutnya.
Baca bersama `CLAUDE.md`.

---

## 1. Prinsip struktur

- Route group per role: `(mahasiswa)`, `(donatur)`, `(admin)`, `(publik)` — memetakan
  langsung ke aturan RBAC di `middleware.ts`.
- Logika domain (Bahasa Indonesia) hidup di `src/lib/<domain>/`, bukan di dalam route.
  Route/page/Server Action memanggil fungsi dari `src/lib`, tidak mengandung logika
  bisnis sendiri.
- Query yang menegakkan aturan privasi (aturan keras 5, 11, 12) hidup di
  `src/server/queries/`, terpisah dari komponen, supaya bisa ditest tanpa render UI.
- Satu modul = satu folder berisi fungsi murni + file test bersebelahan (`*.test.ts`).

---

## 2. Struktur folder

```
src/
  app/
    (publik)/
      login/page.tsx
      register/page.tsx
      403/page.tsx
    (mahasiswa)/
      layout.tsx                 # guard requireRole('MAHASISWA')
      mahasiswa/
        page.tsx                 # dashboard
        pengajuan/page.tsx
        tagihan/page.tsx
        laporan/page.tsx
    (donatur)/
      layout.tsx                 # guard requireRole('ORTU_ASUH')
      donatur/
        page.tsx
        komitmen/page.tsx
        pembayaran/page.tsx
        binaan/page.tsx
        laporan/page.tsx
    (admin)/
      layout.tsx                 # guard requireRole('ADMIN')
      admin/
        page.tsx
        pengajuan/page.tsx
        transaksi/page.tsx
        alokasi/
          simulasi/page.tsx
          [batchId]/page.tsx
        pembinaan/page.tsx
        monitoring/page.tsx
        pesan/page.tsx
        pengaturan/page.tsx
    api/
      berkas/[id]/route.ts        # signed URL, cek otorisasi tiap request
      webhook/payment/route.ts
      cron/
        jadwal-bayar/route.ts
        reminder/route.ts
        laporan-reminder/route.ts
    layout.tsx
    page.tsx
    globals.css

  server/
    queries/                      # query yang menegakkan privasi/RBAC lapis ketiga
      pengajuan.ts
      binaan.ts
      monitoring.ts

  lib/
    env.ts                        # validasi env pakai Zod, gagal keras di startup
    db.ts                         # singleton PrismaClient
    uang.ts                       # formatRupiah, parseRupiah
    audit.ts                      # catatAudit(tx, {...})
    rbac.ts                       # requireRole, assertPemilik
    storage/
      minio.ts                    # client MinIO, signed URL
    alokasi/
      engine.ts                   # susunRencana (murni), jalankanAlokasi, setujuiBatch,
                                   # laporanPenyaluran — TIDAK ditulis ulang tanpa konfirmasi
    komitmen/
      jadwal.ts                   # generateJadwal (murni)
    keuangan/
      ledger.ts                   # hitungSaldo(tx, periodeId)
    skoring/
      kelayakan.ts                # hitungSkor (murni)
    monitoring/
      risiko.ts                   # hitungRisiko (murni)
    payment/
      midtrans.ts
    email/
      resend.ts
      templates/

  components/
    ui/                            # komponen dasar tanpa styling final (Sesi 9 baru dipoles)
    forms/

  types/
    index.ts

prisma/
  schema.prisma
  seed.ts
  migrations/

deploy/                            # diisi Sesi 10 — jangan sentuh kode app dari sini
  Dockerfile
  docker-compose.prod.yml
  nginx/
  systemd/
  backup.sh
  README.md

tests/
  setup.ts                        # setup vitest (kalau perlu, mis. env test)
```

Folder yang belum diisi kode pada Sesi 0 dibuat kosong dengan `.gitkeep` supaya
strukturnya terlihat dari awal.

---

## 3. Peta endpoint (ringkas)

| Route | Role | Sesi |
|---|---|---|
| `/login`, `/register`, `/403` | publik | 1 |
| `/mahasiswa/pengajuan` | MAHASISWA | 2 |
| `/mahasiswa/tagihan` | MAHASISWA | 6 |
| `/mahasiswa/laporan` | MAHASISWA | 7 |
| `/donatur/komitmen` | ORTU_ASUH | 4 |
| `/donatur/pembayaran` | ORTU_ASUH | 4, 5 |
| `/donatur/binaan` | ORTU_ASUH | 7 |
| `/donatur/laporan` | ORTU_ASUH | 6 |
| `/admin/pengajuan` | ADMIN | 2 |
| `/admin/transaksi` | ADMIN | 5 |
| `/admin/alokasi/simulasi` | ADMIN | 6 |
| `/admin/alokasi/[batchId]` | ADMIN | 6 |
| `/admin/pembinaan` | ADMIN | 7 |
| `/admin/monitoring` | ADMIN | 7 |
| `/admin/pesan` | ADMIN | 7 |
| `GET /api/berkas/[id]` | pemilik / ADMIN | 2 |
| `POST /api/webhook/payment` | publik (verifikasi signature) | 8 |
| `POST /api/cron/*` | `CRON_SECRET` header | 8 |

---

## 4. Urutan pembangunan

Mengikuti urutan sesi di `PROMPT-CLAUDE-CODE.md`:

0. Bootstrap kerangka (sesi ini)
1. Auth & RBAC
2. Pengajuan mahasiswa + verifikasi berkas
3. Skoring kelayakan
4. Komitmen & jadwal bayar
5. Transaksi & ledger (menyentuh uang)
6. Mesin alokasi (menyentuh uang, memakai `engine.ts`)
7. Monitoring & pembinaan (menyentuh data pribadi)
8. Otomasi (payment gateway, potong gaji, cron)
9. Tema visual
10. Deployment VPS

Sesi 5, 6, 7 adalah yang paling berisiko — lihat catatan di `PROMPT-CLAUDE-CODE.md`.

---

## 5. Catatan implementasi Sesi 0

- `engine.ts` ditulis di Sesi 0 sebagai modul logika alokasi yang sudah final
  (pure function `susunRencana` + fungsi orkestrasi `jalankanAlokasi`,
  `setujuiBatch`, `laporanPenyaluran`). Sesi 6 **menyambungkan** modul ini ke
  UI/Server Action, bukan menulis ulang logikanya.
- Mode distribusi yang diimplementasikan: `KUOTA_TUNTAS` (kandidat hanya
  didanai kalau saldo pool cukup untuk melunasi tagihannya penuh; kalau
  tidak cukup, dilewati dan dicoba kandidat berikutnya). Mode lain bisa
  ditambahkan sebagai varian `ModeAlokasi` tanpa mengubah kontrak fungsi.
- `Periode.nominalFull` pada schema saat ini seragam per periode (satu nilai
  per `Periode`), belum berbeda per prodi — sesuai catatan "jangan
  asumsikan nominal seragam" di `CLAUDE.md`, ini masih perlu dikonfirmasi
  pengelola program sebelum Sesi 6 berjalan penuh.
