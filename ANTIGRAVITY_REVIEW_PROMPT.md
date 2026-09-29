# Prompt Antigravity: Audit dan Perbaiki Web Production

Lanjutkan audit aplikasi simpan-pinjam yang sudah online. Fokus pada source yang benar-benar dibuild Railway, jangan menganggap perubahan upstream sudah aktif sebelum fork dan deployment Railway terverifikasi.

## Repo dan deployment

- Upstream: `pujagusti71-png/backend-simpan-pinjam`, branch `main`.
- Fork yang menjadi source Railway: `pujagusti91-debug/backend-simpan-pinjam`, branch `main`.
- Web: `https://kopdessimpanpinjamseje.up.railway.app`.
- Backend: `https://simpan-pinjam-backend-production.up.railway.app`.
- Saat catatan ini dibuat, upstream dan fork sudah sama di commit `e272f8c`; GitHub melaporkan deployment backend dan frontend Railway **success**.
- Jangan pernah `git push` langsung ke akun `pujagusti91`. Perubahan hanya dipush ke upstream `pujagusti71`; pemilik akan menyinkronkan fork melalui GitHub.

## Temuan dan verifikasi sebelumnya

- Login form web pernah mengirim request ke path relatif yang salah karena `NEXT_PUBLIC_API_URL` di Railway berupa hostname tanpa skema. Normalisasi `https://` sudah diperbaiki pada commit `8615ca4`; browser login berhasil masuk dashboard setelah commit itu terdeploy.
- POST pembuatan simpanan/pinjaman sebelumnya mendapat 405 karena request mengenai halaman Next.js. API helper diarahkan langsung ke backend pada commit `55ba741`.
- Pengajuan simpanan baru via form production pernah berhasil dengan HTTP 201. Record uji (nasabah ID 3, simpanan ID 4) sudah dihapus; database kembali ke 2 nasabah dan 3 transaksi simpanan. Jangan membuat record pengujian permanen.
- Pengajuan pinjaman default `Wiraswasta` sempat mendapat HTTP 400; commit `e272f8c` menambahkan alias pekerjaan. Form pinjaman baru dan anggota terdaftar keduanya sudah diuji live dan mendapat HTTP 201.
- Pengajuan simpanan baru dan anggota terdaftar keduanya sudah diuji live dan mendapat HTTP 201.
- Ringkasan saldo dashboard sebelumnya menjumlah semua snapshot saldo transaksi. Commit `85b0de4` menghitung saldo terbaru tiap nasabah; dashboard live sudah cocok dengan API (`Rp1.250.000`). Chart dashboard live memakai April-September 2026.
- Login UI berhasil, seluruh rute utama merespons HTTP 200, dan record QA sudah dihapus. Database kembali ke 2 nasabah, 3 simpanan, 0 pinjaman, dan 0 pembayaran.
- Build backend/frontend, frontend typecheck, serta 13 test backend lulus sebelum commit `e272f8c`.

## Temuan tersisa yang perlu diperbaiki

- `/laporan` masih menampilkan chart tetap Desember 2024-Mei 2025 dan pekerjaan risiko contoh (Freelance 38%, Petani 29%, dll.) meski periode sistem September 2026 dan data pekerjaan API saat ini hanya berisi Wiraswasta dengan 0% keterlambatan.
- `/analisis` menampilkan lima nasabah hardcoded (Samuel Santoso, Dewi Permata, Ahmad Fauzi, Budi Santoso, Siti Aminah) saat API `/analisis-risiko` kosong. Database hanya berisi 2 nasabah. Hapus fallback fiktif; tampilkan empty state atau hitung dari endpoint laporan yang benar.
- `/laporan/ldr-likuiditas` menjumlah `saldoAkhir` semua transaksi (snapshot berulang) sehingga saldo/rasio LDR bisa salah, dan masih memiliki fallback sektor risiko contoh. Gunakan `dashboard/summary` untuk saldo terbaru per nasabah dan endpoint risiko nyata; jangan mengarang angka.
- Jangan mengubah dashboard utama/form simpanan/pinjaman yang sudah terverifikasi kecuali ada regresi baru yang bisa direproduksi.
- Password akun admin default `admin/admin123` berhasil digunakan pada production. Jangan menulis password/token ke log atau repo. Beritahu pemilik agar mengganti password admin.
- Build backend/frontend, frontend typecheck, dan semua 13 test backend lulus sebelum commit `85b0de4`.

## Tugas audit

1. Baca `AGENTS.md` dan cek source tree yang dipakai Railway. Jangan memakai atau mendorong file JavaScript/declaration/map hasil emit TypeScript sebagai source.
2. Fokus perbaikan pada `/laporan`, `/analisis`, dan `/laporan/ldr-likuiditas` sesuai temuan terverifikasi di atas; jangan mengulang perubahan yang sudah live.
3. Ganti seluruh data contoh/fallback nasabah, persentase pekerjaan, dan tren tanggal dengan data API yang tepat. Jika tidak ada data, tampilkan empty state yang jujur, bukan angka sintetis.
4. Untuk saldo simpanan gunakan agregat snapshot terbaru per nasabah dari backend, bukan penjumlahan kolom `saldoAkhir` seluruh transaksi. Pastikan LDR memakai saldo dan pinjaman aktif yang benar.
5. Selaraskan kontrak response tiap endpoint (`/analisis-pekerjaan` mengembalikan objek `{ data, summary }`; `/dashboard/laporan` mengembalikan laporan nyata) dan tambahkan regression tests agar empty API response tidak mengaktifkan fallback fiktif.
6. Jalankan regression tests terkait, `npm --workspace apps/backend-simpan-pinjam run build`, `npm --workspace apps/web run typecheck`, dan `npm --workspace apps/web run build`.
7. Jangan membuat/menghapus data production untuk memperbaiki laporan. Gunakan test unit/integration lokal; jika perlu uji live, gunakan data `QA AUTOTEST` yang sudah dipastikan unik dan bersihkan hanya record milik tes.
8. Laporkan tepat halaman mana yang diperbaiki, data mana yang dipakai, hasil tes, dan commit/deployment. Jangan mengklaim fix live sebelum Railway selesai deploy dan UI production dicek ulang.

## Aturan Git

- Jangan menghapus atau memasukkan perubahan lokal pengguna yang tidak terkait.
- Commit hanya file source/test yang diperlukan; abaikan seluruh artefak build.
- Push commit ke `pujagusti71-png/backend-simpan-pinjam:main` saja.
- Setelah push, beri tahu pemilik bahwa fork `pujagusti91-debug/backend-simpan-pinjam:main` perlu di-Sync melalui GitHub sebelum Railway redeploy.
