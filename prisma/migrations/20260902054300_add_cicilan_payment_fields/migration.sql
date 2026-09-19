/*
  Warnings:

  - You are about to drop the column `alamatIbuKandung` on the `Nasabah` table. All the data in the column will be lost.
  - You are about to drop the column `analisis_risiko_pekerjaan_id` on the `Nasabah` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Nasabah` table. All the data in the column will be lost.
  - You are about to drop the column `kategori_risiko_pekerjaan` on the `Nasabah` table. All the data in the column will be lost.
  - You are about to drop the column `namaIbuKandung` on the `Nasabah` table. All the data in the column will be lost.
  - You are about to drop the column `noHp` on the `Nasabah` table. All the data in the column will be lost.
  - You are about to drop the column `noRek` on the `Nasabah` table. All the data in the column will be lost.
  - You are about to drop the column `skor_risiko_pekerjaan` on the `Nasabah` table. All the data in the column will be lost.
  - You are about to drop the column `tanggalLahirIbuKandung` on the `Nasabah` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Nasabah" DROP CONSTRAINT "Nasabah_analisis_risiko_pekerjaan_id_fkey";

-- AlterTable
ALTER TABLE "Nasabah" DROP COLUMN "alamatIbuKandung",
DROP COLUMN "analisis_risiko_pekerjaan_id",
DROP COLUMN "email",
DROP COLUMN "kategori_risiko_pekerjaan",
DROP COLUMN "namaIbuKandung",
DROP COLUMN "noHp",
DROP COLUMN "noRek",
DROP COLUMN "skor_risiko_pekerjaan",
DROP COLUMN "tanggalLahirIbuKandung",
ADD COLUMN     "analisisRisikoPekerjaanId" INTEGER,
ADD COLUMN     "jumlahTanggungan" INTEGER,
ADD COLUMN     "kategoriRisikoPekerjaan" TEXT,
ADD COLUMN     "riwayatPembayaran" TEXT,
ADD COLUMN     "skorRisikoPekerjaan" INTEGER;

-- AlterTable
ALTER TABLE "Pembayaran" ADD COLUMN     "jumlahBunga" DOUBLE PRECISION,
ADD COLUMN     "jumlahPokok" DOUBLE PRECISION,
ADD COLUMN     "nomorCicilan" INTEGER,
ADD COLUMN     "tanggalPembayaran" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "tanggalBayar" DROP NOT NULL,
ALTER COLUMN "statusBayar" DROP NOT NULL,
ALTER COLUMN "statusBayar" SET DEFAULT 'lancar';

-- CreateTable
CREATE TABLE "AnalisisRisiko" (
    "id" SERIAL NOT NULL,
    "nasabahId" INTEGER NOT NULL,
    "skorPekerjaan" INTEGER NOT NULL,
    "skorPenghasilan" INTEGER NOT NULL,
    "skorLamaBekerja" INTEGER NOT NULL,
    "skorRiwayat" INTEGER NOT NULL,
    "skorTanggungan" INTEGER NOT NULL,
    "totalSkor" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalisisRisiko_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Nasabah" ADD CONSTRAINT "Nasabah_analisisRisikoPekerjaanId_fkey" FOREIGN KEY ("analisisRisikoPekerjaanId") REFERENCES "analisis_risiko_pekerjaan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalisisRisiko" ADD CONSTRAINT "AnalisisRisiko_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "Nasabah"("id") ON DELETE CASCADE ON UPDATE CASCADE;
