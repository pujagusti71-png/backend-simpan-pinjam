/*
  Warnings:

  - You are about to drop the `analisis_per_pekerjaan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `nasabah` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pembayaran` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `peminjamaneksternal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pinjaman` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `risiko_nasabah` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `riwayat_kredit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pembayaran" DROP CONSTRAINT "pembayaran_pinjamanId_fkey";

-- DropForeignKey
ALTER TABLE "peminjamaneksternal" DROP CONSTRAINT "peminjamaneksternal_nasabahId_fkey";

-- DropForeignKey
ALTER TABLE "pinjaman" DROP CONSTRAINT "pinjaman_nasabahId_fkey";

-- DropForeignKey
ALTER TABLE "risiko_nasabah" DROP CONSTRAINT "risiko_nasabah_nasabahId_fkey";

-- DropForeignKey
ALTER TABLE "riwayat_kredit" DROP CONSTRAINT "riwayat_kredit_nasabahId_fkey";

-- DropTable
DROP TABLE "analisis_per_pekerjaan";

-- DropTable
DROP TABLE "nasabah";

-- DropTable
DROP TABLE "pembayaran";

-- DropTable
DROP TABLE "peminjamaneksternal";

-- DropTable
DROP TABLE "pinjaman";

-- DropTable
DROP TABLE "risiko_nasabah";

-- DropTable
DROP TABLE "riwayat_kredit";

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nasabah" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "pekerjaan" TEXT NOT NULL,
    "penghasilan" DOUBLE PRECISION NOT NULL,
    "saldoRataRata" DOUBLE PRECISION,
    "estimasiPengeluaran" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nasabah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simpanan" (
    "id" SERIAL NOT NULL,
    "nasabahId" INTEGER NOT NULL,
    "jumlahSetoran" DOUBLE PRECISION NOT NULL,
    "bungaSimpanan" DOUBLE PRECISION,
    "jenisInterest" TEXT,
    "tanggalSetoran" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saldoAkhir" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aktif',
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Simpanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransaksiBunga" (
    "id" SERIAL NOT NULL,
    "simpananId" INTEGER NOT NULL,
    "nominalBunga" DOUBLE PRECISION NOT NULL,
    "tanggalTransaksi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransaksiBunga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pinjaman" (
    "id" SERIAL NOT NULL,
    "nasabahId" INTEGER NOT NULL,
    "jumlahPinjaman" DOUBLE PRECISION NOT NULL,
    "tenor" INTEGER NOT NULL,
    "sukuBunga" DOUBLE PRECISION NOT NULL,
    "jenisBunga" TEXT NOT NULL,
    "tanggalPengajuan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalAsetujuan" TIMESTAMP(3),
    "tanggalSelesai" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "cicilanBulanan" DOUBLE PRECISION,
    "totalBunga" DOUBLE PRECISION,
    "totalPembayaran" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pinjaman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pembayaran" (
    "id" SERIAL NOT NULL,
    "pinjamanId" INTEGER NOT NULL,
    "jumlahBayar" DOUBLE PRECISION NOT NULL,
    "tanggalBayar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusBayar" TEXT NOT NULL,
    "dariTanggalSeharusnya" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiwayatKredit" (
    "id" SERIAL NOT NULL,
    "nasabahId" INTEGER NOT NULL,
    "totalPinjamanAktif" INTEGER NOT NULL,
    "statusBI" TEXT NOT NULL,
    "kolektibilitas" TEXT NOT NULL,
    "pernahMacet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiwayatKredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeminjamanEksternal" (
    "id" SERIAL NOT NULL,
    "nasabahId" INTEGER NOT NULL,
    "jumlahPinjaman" DOUBLE PRECISION NOT NULL,
    "kolektibilitas" TEXT NOT NULL,
    "sumberPinjaman" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeminjamanEksternal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RisikoNasabah" (
    "id" SERIAL NOT NULL,
    "nasabahId" INTEGER NOT NULL,
    "rasioSiklusPersentase" DOUBLE PRECISION,
    "skorRisiko" INTEGER NOT NULL,
    "kategoriRisiko" TEXT NOT NULL,
    "persentaseKeterlambatan" DOUBLE PRECISION,
    "frekuensiPinjaman" INTEGER,
    "penjumlahPeminjamanAktif" INTEGER,
    "indikasiBehaviorBerisiko" TEXT,
    "rekomendasi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RisikoNasabah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalisisPerPekerjaan" (
    "id" SERIAL NOT NULL,
    "pekerjaan" TEXT NOT NULL,
    "totalNasabah" INTEGER NOT NULL,
    "nasabahTelat" INTEGER NOT NULL,
    "nasabahLancar" INTEGER NOT NULL,
    "persentaseKeterlambatan" DOUBLE PRECISION NOT NULL,
    "rataRataPenghasilan" DOUBLE PRECISION NOT NULL,
    "rataRataRasioCikilan" DOUBLE PRECISION NOT NULL,
    "tingkatRisiko" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalisisPerPekerjaan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Nasabah_nik_key" ON "Nasabah"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "RisikoNasabah_nasabahId_key" ON "RisikoNasabah"("nasabahId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalisisPerPekerjaan_pekerjaan_key" ON "AnalisisPerPekerjaan"("pekerjaan");

-- AddForeignKey
ALTER TABLE "Simpanan" ADD CONSTRAINT "Simpanan_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "Nasabah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiBunga" ADD CONSTRAINT "TransaksiBunga_simpananId_fkey" FOREIGN KEY ("simpananId") REFERENCES "Simpanan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pinjaman" ADD CONSTRAINT "Pinjaman_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "Nasabah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pembayaran" ADD CONSTRAINT "Pembayaran_pinjamanId_fkey" FOREIGN KEY ("pinjamanId") REFERENCES "Pinjaman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatKredit" ADD CONSTRAINT "RiwayatKredit_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "Nasabah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeminjamanEksternal" ADD CONSTRAINT "PeminjamanEksternal_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "Nasabah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RisikoNasabah" ADD CONSTRAINT "RisikoNasabah_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "Nasabah"("id") ON DELETE CASCADE ON UPDATE CASCADE;
