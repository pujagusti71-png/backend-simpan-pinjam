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
        const email = payload.email || payload.emailAddress;
        const penghasilan = Number(payload.penghasilan ?? payload.penghasilanBulanan ?? 0);
        const cicilan = Number(payload.cicilan ?? payload.cicilanBulanan ?? 0);
        const jumlah = Number(payload.jumlah ?? payload.jumlahPinjaman ?? 0);
        const tenor = Number(payload.tenor ?? payload.tenorBulan ?? 0);
        const bunga = Number(payload.bunga ?? payload.sukuBunga ?? 0);
        const tujuan = payload.tujuan || payload.purpose || null;
        const risiko = payload.risiko || payload.risk || 'Belum ditentukan';
        const rekomendasi = payload.rekomendasi || payload.recommendation || 'Review';

        if (!nama || !nik) {
            throw new BadRequestException('Field nama dan nik wajib diisi');
        }

        if (!jumlah || !tenor) {
            throw new BadRequestException('Field jumlah dan tenor wajib diisi');
        }

        return {
            nama,
            nik,
            email,
            penghasilan,
            cicilan,
            jumlah,
            tenor,
            bunga,
            tujuan,
            risiko,
            rekomendasi,
        };
    }

    private async ensureNasabah(payload: ReturnType<PinjamanService['normalizePayload']>) {
        const existingNasabah = await this.prisma.nasabah.findUnique({
            where: { nik: payload.nik },
        });

        if (existingNasabah) {
            return existingNasabah.id;
        }

        const createdNasabah = await this.prisma.nasabah.create({
            data: {
                nama: payload.nama,
                nik: payload.nik,
                pekerjaan: payload.tujuan ? 'Tidak tercantum' : 'Tidak tercantum',
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
            // Efektif (compound) interest calculation
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
            const nasabahId = await this.ensureNasabah(payload);

            const calculations = this.calculateInstallment(
                payload.jumlah,
                payload.bunga || 0,
                payload.tenor,
                'efektif',
            );

            const createdPinjaman = await this.prisma.pinjaman.create({
                data: {
                    nasabahId,
                    jumlahPinjaman: payload.jumlah,
                    tenor: payload.tenor,
                    sukuBunga: payload.bunga || 0,
                    jenisBunga: 'efektif',
                    status: 'pending',
                    cicilanBulanan: calculations.cicilanBulanan,
                    totalBunga: calculations.totalBunga,
                    totalPembayaran: calculations.totalPembayaran,
                },
            });

            await this.prisma.risikoNasabah.create({
                data: {
                    nasabahId,
                    skorRisiko: payload.risiko === 'Rendah' ? 20 : payload.risiko === 'Sedang' ? 50 : 80,
                    kategoriRisiko: payload.risiko.toLowerCase(),
                    rekomendasi: payload.rekomendasi,
                },
            }).catch(() => undefined);

            return {
                id: createdPinjaman.id,
                nasabahId: createdPinjaman.nasabahId,
                nama: payload.nama,
                nik: payload.nik,
                jumlahPinjaman: createdPinjaman.jumlahPinjaman,
                tenor: createdPinjaman.tenor ?? payload.tenor,
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
