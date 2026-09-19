-- Repair identity columns that may be missing after the legacy migration was baselined.
ALTER TABLE "Nasabah" ADD COLUMN IF NOT EXISTS "tanggalLahir" TIMESTAMP(3);
ALTER TABLE "Nasabah" ADD COLUMN IF NOT EXISTS "alamat" TEXT;
