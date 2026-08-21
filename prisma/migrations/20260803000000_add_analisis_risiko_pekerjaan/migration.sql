-- CreateTable
CREATE TABLE "analisis_risiko_pekerjaan" (
    "id" SERIAL NOT NULL,
    "pekerjaan" TEXT NOT NULL,
    "skor_risiko" INTEGER NOT NULL,
    "kategori_risiko" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analisis_risiko_pekerjaan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "analisis_risiko_pekerjaan_pekerjaan_key" ON "analisis_risiko_pekerjaan"("pekerjaan");

-- AlterTable
ALTER TABLE "Nasabah"
ADD COLUMN "skor_risiko_pekerjaan" INTEGER,
ADD COLUMN "kategori_risiko_pekerjaan" TEXT,
ADD COLUMN "analisis_risiko_pekerjaan_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Nasabah"
ADD CONSTRAINT "Nasabah_analisis_risiko_pekerjaan_id_fkey"
FOREIGN KEY ("analisis_risiko_pekerjaan_id") REFERENCES "analisis_risiko_pekerjaan"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
