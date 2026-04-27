# 💸 PayTrack — Aplikasi Manajemen Keuangan

Aplikasi manajemen keuangan pribadi yang mendukung IDR & JPY, dengan fitur pemasukan, pengeluaran, pajak, dan analitik diagram lingkaran.

---

## 🚀 CARA DEPLOY KE VERCEL (Gratis, 5 Menit)

### Langkah 1 — Install Node.js
Download dan install dari: https://nodejs.org (pilih versi LTS)

### Langkah 2 — Install Vercel CLI
Buka Terminal / Command Prompt, ketik:
```
npm install -g vercel
```

### Langkah 3 — Masuk ke folder project
```
cd paytrack
```

### Langkah 4 — Deploy!
```
vercel
```
- Ikuti petunjuk di layar
- Pilih "Y" untuk semua pertanyaan default
- Selesai! Kamu akan dapat link seperti: `https://paytrack-xxx.vercel.app`

---

## 💻 Cara Jalankan di Komputer (Development)

```bash
npm install
npm run dev
```
Buka browser: http://localhost:5173

---

## 📦 Cara Build untuk Production

```bash
npm run build
```
Folder `dist/` siap di-upload ke hosting manapun.

---

## 📱 Cara Install di HP (PWA)

Setelah deploy ke Vercel:
1. Buka link Vercel di **Safari** (iPhone) atau **Chrome** (Android)
2. Tap tombol **Share** → **"Add to Home Screen"**
3. App akan muncul di home screen seperti aplikasi biasa!

---

## 💰 Cara Jual Aplikasi Ini

### Opsi A — Jual Akses Web App
1. Deploy ke Vercel (gratis)
2. Daftarkan domain custom (opsional, ~Rp 150rb/tahun)
3. Pasang paywall menggunakan **Gumroad** atau **Lemon Squeezy**
4. Jual subscription bulanan

### Opsi B — Jual Source Code
1. Zip seluruh folder `paytrack/`
2. Upload ke **Gumroad.com** atau **CodeCanyon.net**
3. Set harga (biasanya $5–$49 untuk template React)
4. Promosikan di Twitter/X, LinkedIn, atau forum developer

### Opsi C — Jadikan App Mobile
1. Install Capacitor: `npm install @capacitor/core @capacitor/cli`
2. Build: `npm run build`
3. Sync: `npx cap add android` atau `npx cap add ios`
4. Publish ke Google Play ($25 sekali) atau App Store ($99/tahun)

---

## 🛠 Fitur Aplikasi

- ✅ Pemasukan & Pengeluaran dengan kategori
- ✅ Pajak per transaksi (5%, 8%, 10%, 11%, 12%, custom)
- ✅ Support IDR (Rupiah) & JPY (Yen)
- ✅ Diagram lingkaran (Donut Chart) interaktif
- ✅ Riwayat transaksi dengan filter & pencarian
- ✅ Data tersimpan otomatis (localStorage)
- ✅ Tampilan dark mode yang rapi
- ✅ PWA — bisa diinstall di HP seperti app native

---

## 📁 Struktur File

```
paytrack/
├── index.html          ← Entry point HTML
├── package.json        ← Dependencies
├── vite.config.js      ← Konfigurasi build
├── vercel.json         ← Konfigurasi deploy
├── public/
│   └── manifest.json   ← PWA manifest
└── src/
    ├── main.jsx        ← React entry point
    └── App.jsx         ← Aplikasi utama (semua kode ada di sini)
```

---

Dibuat dengan React + Vite · Deploy dengan Vercel
