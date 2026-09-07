-- AddColumn tanggalLahir, alamat, noHp, email, noRek, namaIbuKandung, alamatIbuKandung, tanggalLahirIbuKandung to Nasabah
ALTER TABLE "Nasabah" ADD COLUMN IF NOT EXISTS "tanggalLahir" TIMESTAMP(3);
ALTER TABLE "Nasabah" ADD COLUMN IF NOT EXISTS "alamat" TEXT;
ALTER TABLE "Nasabah" ADD COLUMN IF NOT EXISTS "noHp" TEXT;
ALTER TABLE "Nasabah" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Nasabah" ADD COLUMN IF NOT EXISTS "noRek" TEXT;
ALTER TABLE "Nasabah" ADD COLUMN IF NOT EXISTS "namaIbuKandung" TEXT;
ALTER TABLE "Nasabah" ADD COLUMN IF NOT EXISTS "alamatIbuKandung" TEXT;
ALTER TABLE "Nasabah" ADD COLUMN IF NOT EXISTS "tanggalLahirIbuKandung" TIMESTAMP(3);
