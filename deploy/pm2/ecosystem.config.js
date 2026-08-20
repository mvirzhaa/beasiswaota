// Dipakai kalau Next.js dijalankan NATIVE di VPS (bukan lewat Docker) —
// lihat deploy/README.md untuk pilihan Docker vs PM2.
//
// Setup sekali:
//   npm ci && npm run build
//   pm2 start deploy/pm2/ecosystem.config.js
//   pm2 save && pm2 startup   # PM2 otomatis start lagi setelah VPS reboot
//   pm2 install pm2-logrotate # rotasi log, konfigurasi di bawah
//   pm2 set pm2-logrotate:max_size 20M
//   pm2 set pm2-logrotate:retain 14
//   pm2 set pm2-logrotate:compress true
//
// Rilis baru:
//   git pull && npm ci && npm run build
//   npx prisma migrate deploy
//   pm2 reload beasiswaota   # cluster mode -> reload tanpa downtime

module.exports = {
  apps: [
    {
      name: "beasiswaota",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/opt/beasiswaota/current",
      instances: 2,
      exec_mode: "cluster",
      // Next.js sendiri otomatis memuat .env / .env.production dari cwd
      // (lihat WorkingDirectory) — TIDAK ada mekanisme "env_file" resmi di
      // PM2, jadi taruh .env langsung di /opt/beasiswaota/current/.env
      // (symlink ke /opt/beasiswaota/shared/.env supaya tidak ikut ke-reset
      // tiap deploy baru menimpa folder "current").
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "500M",
      autorestart: true,
      restart_delay: 3000,
      error_file: "/var/log/beasiswaota/error.log",
      out_file: "/var/log/beasiswaota/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      kill_timeout: 10000,
    },
  ],
};
