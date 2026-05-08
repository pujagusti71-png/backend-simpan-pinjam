-- CreateTable
CREATE TABLE "nasabah" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "pekerjaan" TEXT NOT NULL,
    "penghasilan" DOUBLE PRECISION NOT NULL,
    "saldoRataRata" DOUBLE PRECISION,
    "estimasiPengeluaran" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nasabah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pinjaman" (
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

    CONSTRAINT "pinjaman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pembayaran" (
    "id" SERIAL NOT NULL,
    "pinjamanId" INTEGER NOT NULL,
    "jumlahBayar" DOUBLE PRECISION NOT NULL,
    "tanggalBayar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusBayar" TEXT NOT NULL,
    "dariTanggalSeharusnya" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riwayat_kredit" (
    "id" SERIAL NOT NULL,
    "nasabahId" INTEGER NOT NULL,
    "totalPinjamanAktif" INTEGER NOT NULL,
    "statusBI" TEXT NOT NULL,
    "kolektibilitas" TEXT NOT NULL,
    "pernahMacet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "riwayat_kredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peminjamaneksternal" (
    "id" SERIAL NOT NULL,
    "nasabahId" INTEGER NOT NULL,
    "jumlahPinjaman" DOUBLE PRECISION NOT NULL,
    "kolektibilitas" TEXT NOT NULL,
    "sumberPinjaman" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "peminjamaneksternal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risiko_nasabah" (
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

    CONSTRAINT "risiko_nasabah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analisis_per_pekerjaan" (
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

    CONSTRAINT "analisis_per_pekerjaan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nasabah_nik_key" ON "nasabah"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "risiko_nasabah_nasabahId_key" ON "risiko_nasabah"("nasabahId");

-- CreateIndex
CREATE UNIQUE INDEX "analisis_per_pekerjaan_pekerjaan_key" ON "analisis_per_pekerjaan"("pekerjaan");

-- AddForeignKey
ALTER TABLE "pinjaman" ADD CONSTRAINT "pinjaman_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_pinjamanId_fkey" FOREIGN KEY ("pinjamanId") REFERENCES "pinjaman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riwayat_kredit" ADD CONSTRAINT "riwayat_kredit_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peminjamaneksternal" ADD CONSTRAINT "peminjamaneksternal_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risiko_nasabah" ADD CONSTRAINT "risiko_nasabah_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE CASCADE ON UPDATE CASCADE;
