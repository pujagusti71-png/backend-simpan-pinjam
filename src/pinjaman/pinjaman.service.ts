import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePinjamanDto } from './dto/create-pinjaman.dto';
import { UpdatePinjamanDto } from './dto/update-pinjaman.dto';

@Injectable()
export class PinjamanService {
    constructor(private prisma: PrismaService) { }

    private normalizePayload(createPinjamanDto: any) {
        const payload = createPinjamanDto || {};

        const nama = payload.nama || payload.name || payload.namaLengkap;
        const nik = payload.nik || payload.NIK;
        const tanggalLahir = payload.tanggalLahir ? new Date(payload.tanggalLahir) : undefined;
        const alamat = payload.alamat?.trim();
        const pekerjaan = payload.pekerjaan?.trim();
        const email = payload.email || payload.emailAddress;
        const penghasilan = Number(payload.penghasilan ?? payload.penghasilanBulanan ?? 0);
        const cicilan = Number(payload.cicilan ?? payload.cicilanBulanan ?? 0);
        const jumlah = Number(payload.jumlah ?? payload.jumlahPinjaman ?? 0);
        const tenor = Number(payload.tenor ?? payload.tenorBulan ?? 0);
        const bunga = Number(payload.bunga ?? payload.sukuBunga ?? 0);
        const tujuan = payload.tujuan || payload.purpose || null;

        if (!nama || !nik || !tanggalLahir || !alamat || !pekerjaan) {
            throw new BadRequestException('Field nama, nik, tanggal lahir, alamat, dan pekerjaan wajib diisi');
        }

        if (Number.isNaN(tanggalLahir.getTime())) {
            throw new BadRequestException('Format tanggal lahir tidak valid');
        }

        if (!jumlah || !tenor) {
            throw new BadRequestException('Field jumlah dan tenor wajib diisi');
        }

        return {
            nama,
            nik,
            tanggalLahir,
            alamat,
            pekerjaan,
            email,
            penghasilan,
            cicilan,
            jumlah,
            tenor,
            bunga,
            tujuan,
        };
    }

    private async validateLoanEligibility(pekerjaan: string, jumlah: number) {
        const normalizedPekerjaan = pekerjaan?.trim();

        let analisis = await this.prisma.analisisRisikoPekerjaan.findFirst({
            where: { pekerjaan: { equals: normalizedPekerjaan, mode: 'insensitive' } },
        });

        if (!analisis) {
            const fallbackMasterData = [
                { pekerjaan: 'PNS', skorRisiko: 10, kategoriRisiko: 'Sangat Rendah' },
                { pekerjaan: 'TNI/POLRI', skorRisiko: 15, kategoriRisiko: 'Sangat Rendah' },
                { pekerjaan: 'Pegawai BUMN', skorRisiko: 15, kategoriRisiko: 'Sangat Rendah' },
                { pekerjaan: 'Guru/Dosen', skorRisiko: 20, kategoriRisiko: 'Rendah' },
                { pekerjaan: 'Tenaga Medis', skorRisiko: 20, kategoriRisiko: 'Rendah' },
                { pekerjaan: 'Pegawai Bank', skorRisiko: 20, kategoriRisiko: 'Rendah' },
                { pekerjaan: 'Karyawan Swasta Tetap', skorRisiko: 25, kategoriRisiko: 'Rendah' },
                { pekerjaan: 'Karyawan Kontrak', skorRisiko: 40, kategoriRisiko: 'Sedang' },
                { pekerjaan: 'Pegawai Honorer', skorRisiko: 50, kategoriRisiko: 'Sedang' },
                { pekerjaan: 'Profesional', skorRisiko: 30, kategoriRisiko: 'Rendah' },
                { pekerjaan: 'Sales/Marketing', skorRisiko: 45, kategoriRisiko: 'Sedang' },
                { pekerjaan: 'Wirausaha/Pengusaha/UMKM/Pedagang', skorRisiko: 50, kategoriRisiko: 'Sedang' },
                { pekerjaan: 'Petani/Pekebun/Peternak', skorRisiko: 60, kategoriRisiko: 'Tinggi' },
                { pekerjaan: 'Nelayan', skorRisiko: 65, kategoriRisiko: 'Tinggi' },
                { pekerjaan: 'Buruh Harian', skorRisiko: 70, kategoriRisiko: 'Sangat Tinggi' },
                { pekerjaan: 'Buruh Pabrik', skorRisiko: 45, kategoriRisiko: 'Sedang' },
                { pekerjaan: 'Tukang Bangunan/Teknisi/Mekanik', skorRisiko: 45, kategoriRisiko: 'Sedang' },
                { pekerjaan: 'Sopir', skorRisiko: 45, kategoriRisiko: 'Sedang' },
                { pekerjaan: 'Driver Ojol', skorRisiko: 65, kategoriRisiko: 'Tinggi' },
                { pekerjaan: 'Kurir', skorRisiko: 50, kategoriRisiko: 'Sedang' },
                { pekerjaan: 'Satpam', skorRisiko: 35, kategoriRisiko: 'Rendah' },
                { pekerjaan: 'Cleaning Service', skorRisiko: 50, kategoriRisiko: 'Sedang' },
                { pekerjaan: 'ART', skorRisiko: 65, kategoriRisiko: 'Tinggi' },
                { pekerjaan: 'Freelance', skorRisiko: 70, kategoriRisiko: 'Tinggi' },
                { pekerjaan: 'Pensiunan', skorRisiko: 30, kategoriRisiko: 'Rendah' },
                { pekerjaan: 'Mahasiswa', skorRisiko: 90, kategoriRisiko: 'Sangat Tinggi' },
                { pekerjaan: 'Belum Bekerja', skorRisiko: 95, kategoriRisiko: 'Sangat Tinggi' },
            ];

            const found = fallbackMasterData.find((item) => item.pekerjaan.toLowerCase() === normalizedPekerjaan.toLowerCase());

            if (found) {
                analisis = await this.prisma.analisisRisikoPekerjaan.upsert({
                    where: { pekerjaan: found.pekerjaan },
                    update: {
                        skorRisiko: found.skorRisiko,
                        kategoriRisiko: found.kategoriRisiko,
                    },
                    create: found,
                });
            }
        }

        if (!analisis) {
            throw new BadRequestException(`Pekerjaan "${pekerjaan}" belum memiliki analisis risiko`);
        }

        const kategori = analisis.kategoriRisiko.trim().toLowerCase();
        if (kategori === 'sangat tinggi') {
            throw new BadRequestException('Pengajuan tidak dapat diproses karena pekerjaan memiliki risiko sangat tinggi');
        }

        if (kategori === 'tinggi' && jumlah > 2_000_000) {
            throw new BadRequestException('Pekerjaan dengan risiko tinggi hanya dapat mengajukan pinjaman maksimal Rp2.000.000');
        }

        return {
            analisis,
            rekomendasi: kategori === 'tinggi' ? 'Approve dengan batas Rp2.000.000' : 'Approve',
        };
    }

    private getLoanInterestRate(jumlahPinjaman: number): number {
        if (jumlahPinjaman >= 100_000_000) return 2;
        if (jumlahPinjaman >= 50_000_000) return 1.5;
        if (jumlahPinjaman >= 20_000_000) return 1;
        if (jumlahPinjaman >= 5_000_000) return 0.5;
        return 0;
    }

    private async ensureNasabah(payload: ReturnType<PinjamanService['normalizePayload']>) {
        const existingNasabah = await this.prisma.nasabah.findUnique({
            where: { nik: payload.nik },
        });

        if (existingNasabah) {
            await this.prisma.nasabah.update({
                where: { id: existingNasabah.id },
                data: {
                    nama: payload.nama,
                    tanggalLahir: payload.tanggalLahir,
                    alamat: payload.alamat,
                    pekerjaan: payload.pekerjaan,
                    penghasilan: payload.penghasilan,
                },
            });
            return existingNasabah.id;
        }

        const createdNasabah = await this.prisma.nasabah.create({
            data: {
                nama: payload.nama,
                nik: payload.nik,
                tanggalLahir: payload.tanggalLahir,
                alamat: payload.alamat,
                pekerjaan: payload.pekerjaan,
                penghasilan: payload.penghasilan,
                riwayatPembayaran: 'Belum ada data',
            },
        });

        return createdNasabah.id;
    }

    /**
     * Calculate monthly installment and total interest
     * @param jumlahPinjaman Loan amount
     * @param sukuBunga Interest rate (%)
     * @param tenor Loan duration (months)
    * @param jenisBunga Interest type (flat/efektif)
     */
    private calculateInstallment(
        jumlahPinjaman: number,
        sukuBunga: number,
        tenor: number,
        jenisBunga: 'flat' | 'efektif',
    ) {
        let totalBunga = 0;
        let cicilanBulanan = 0;

        if (jenisBunga === 'flat') {
            // Flat interest calculation
            totalBunga = (jumlahPinjaman * sukuBunga * tenor) / 100;
            cicilanBulanan = (jumlahPinjaman + totalBunga) / tenor;
        } else {
            // Efektif (compound) interest calculation for legacy records.
            const monthlyRate = sukuBunga / 100 / 12;
            cicilanBulanan =
                (jumlahPinjaman * monthlyRate * Math.pow(1 + monthlyRate, tenor)) /
                (Math.pow(1 + monthlyRate, tenor) - 1);
            totalBunga = cicilanBulanan * tenor - jumlahPinjaman;
        }

        const totalPembayaran = jumlahPinjaman + totalBunga;

        return {
            cicilanBulanan: Math.round(cicilanBulanan * 100) / 100,
            totalBunga: Math.round(totalBunga * 100) / 100,
            totalPembayaran: Math.round(totalPembayaran * 100) / 100,
        };
    }

    async create(createPinjamanDto: CreatePinjamanDto) {
        try {
            const payload = this.normalizePayload(createPinjamanDto);
            const eligibility = await this.validateLoanEligibility(payload.pekerjaan, payload.jumlah);
            const nasabahId = await this.ensureNasabah(payload);
            const bunga = this.getLoanInterestRate(payload.jumlah);

            const calculations = this.calculateInstallment(
                payload.jumlah,
                bunga,
                payload.tenor,
                'flat',
            );

            const createdPinjaman = await this.prisma.pinjaman.create({
                data: {
                    nasabahId,
                    jumlahPinjaman: payload.jumlah,
                    tenor: payload.tenor,
                    sukuBunga: bunga,
                    jenisBunga: 'flat',
                    status: 'pending',
                    cicilanBulanan: calculations.cicilanBulanan,
                    totalBunga: calculations.totalBunga,
                    totalPembayaran: calculations.totalPembayaran,
                },
            });

            await this.prisma.risikoNasabah.create({
                data: {
                    nasabahId,
                    skorRisiko: eligibility.analisis.skorRisiko,
                    kategoriRisiko: eligibility.analisis.kategoriRisiko.toLowerCase(),
                    rekomendasi: eligibility.rekomendasi,
                },
            }).catch(() => undefined);

            return {
                id: createdPinjaman.id,
                nasabahId: createdPinjaman.nasabahId,
                nama: payload.nama,
                nik: payload.nik,
                jumlahPinjaman: createdPinjaman.jumlahPinjaman,
                tenor: createdPinjaman.tenor ?? payload.tenor,
                sukuBunga: createdPinjaman.sukuBunga,
                jenisBunga: createdPinjaman.jenisBunga,
                cicilanBulanan: createdPinjaman.cicilanBulanan,
                totalBunga: createdPinjaman.totalBunga,
                totalPembayaran: createdPinjaman.totalPembayaran,
                createdAt: createdPinjaman.createdAt ?? new Date().toISOString(),
            };
        } catch (error) {
            console.error('PinjamanService.create error:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Gagal membuat pinjaman');
        }
    }

    async findAll() {
        try {
            return await this.prisma.pinjaman.findMany({
                include: {
                    nasabah: {
                        select: {
                            id: true,
                            nama: true,
                            nik: true,
                            pekerjaan: true,
                            penghasilan: true,
                            saldoRataRata: true,
                            estimasiPengeluaran: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                    pembayaran: true,
                },
            });
        } catch (error) {
            console.error('PinjamanService.findAll error:', error);
            throw new InternalServerErrorException('Gagal mengambil daftar pinjaman');
        }
    }

    async findOne(id: number) {
        try {
            return await this.prisma.pinjaman.findUnique({
                where: { id },
                include: {
                    nasabah: {
                        select: {
                            id: true,
                            nama: true,
                            nik: true,
                            pekerjaan: true,
                            penghasilan: true,
                            saldoRataRata: true,
                            estimasiPengeluaran: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                    pembayaran: true,
                },
            });
        } catch (error) {
            console.error('PinjamanService.findOne error:', error);
            throw new InternalServerErrorException('Gagal mengambil data pinjaman');
        }
    }

    async findByNasabah(nasabahId: number) {
        try {
            return await this.prisma.pinjaman.findMany({
                where: { nasabahId },
                include: {
                    pembayaran: true,
                },
            });
        } catch (error) {
            console.error('PinjamanService.findByNasabah error:', error);
            throw new InternalServerErrorException('Gagal mengambil pinjaman nasabah');
        }
    }

    async update(id: number, updatePinjamanDto: UpdatePinjamanDto) {
        return await this.prisma.pinjaman.update({
            where: { id },
            data: updatePinjamanDto,
        });
    }

    async remove(id: number) {
        return await this.prisma.pinjaman.delete({
            where: { id },
        });
    }

    async getActiveLoan(nasabahId: number) {
        return await this.prisma.pinjaman.findMany({
            where: {
                nasabahId,
                status: 'active',
            },
        });
    }

    async countActiveLoan(nasabahId: number) {
        return await this.prisma.pinjaman.count({
            where: {
                nasabahId,
                status: 'active',
            },
        });
    }
}
