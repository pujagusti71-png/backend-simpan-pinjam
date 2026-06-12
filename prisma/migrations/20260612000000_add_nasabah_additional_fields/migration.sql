-- AddColumn tanggalLahir, alamat, noHp, email, noRek, namaIbuKandung, alamatIbuKandung, tanggalLahirIbuKandung to Nasabah
ALTER TABLE "Nasabah" ADD COLUMN "tanggalLahir" TIMESTAMP(3);
ALTER TABLE "Nasabah" ADD COLUMN "alamat" TEXT;
ALTER TABLE "Nasabah" ADD COLUMN "noHp" TEXT;
ALTER TABLE "Nasabah" ADD COLUMN "email" TEXT;
ALTER TABLE "Nasabah" ADD COLUMN "noRek" TEXT;
ALTER TABLE "Nasabah" ADD COLUMN "namaIbuKandung" TEXT;
ALTER TABLE "Nasabah" ADD COLUMN "alamatIbuKandung" TEXT;
ALTER TABLE "Nasabah" ADD COLUMN "tanggalLahirIbuKandung" TIMESTAMP(3);
