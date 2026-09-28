import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSimpananDto, UpdateSimpananDto, ListSimpananDto, PaginatedSimpananResponse } from './dto';

@Injectable()
export class SimpananService {
    constructor(private prisma: PrismaService) { }

    /**
     * Calculate interest based on savings amount, rate, and type
     */
    private calculateInterest(
        saldoSebelumnya: number,
        bungaSimpanan: number,
        jenisInterest: 'flat' | 'efektif' = 'flat',
    ): number {
        if (jenisInterest === 'flat') {
            // Flat interest: (balance * rate) / 100
            return Math.round((saldoSebelumnya * bungaSimpanan) / 100 * 100) / 100;
        } else {
            // Compound interest: balance * (1 + rate/100)
            const nilaiDenganBunga = saldoSebelumnya * (1 + bungaSimpanan / 100);
            return Math.round((nilaiDenganBunga - saldoSebelumnya) * 100) / 100;
        }
    }

    private getBungaRateBySaldo(saldo: number): number {
        if (saldo <= 5_000_000) {
            return 0;
        }

        if (saldo > 5_000_000 && saldo <= 20_000_000) {
            return 0.5;
        }

        return 0.5;
    }

    /**
     * Get current savings balance for a customer
     */
    async getCurrentBalance(nasabahId: number): Promise<number> {
        const simpanan = await this.prisma.simpanan.findMany({
            where: {
                nasabahId,
                status: 'aktif',
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 1,
        });

        return simpanan.length > 0 ? simpanan[0].saldoAkhir : 0;
    }

    /**
     * Create new savings deposit
     */
    async create(createSimpananDto: CreateSimpananDto) {
        let nasabahId = createSimpananDto.nasabahId;

        if (!nasabahId && createSimpananDto.nama && createSimpananDto.nik) {
            const existingNasabah = await this.prisma.nasabah.findUnique({
                where: { nik: createSimpananDto.nik },
            });

            if (existingNasabah) {
                nasabahId = existingNasabah.id;
            } else {
                const createdNasabah = await this.prisma.nasabah.create({
                    data: {
                        nama: createSimpananDto.nama,
                        nik: createSimpananDto.nik,
                        tanggalLahir: createSimpananDto.tanggalLahir ? new Date(createSimpananDto.tanggalLahir) : null,
                        alamat: createSimpananDto.alamat,
                        pekerjaan: createSimpananDto.pekerjaan || 'Lainnya',
                        penghasilan: Number(createSimpananDto.penghasilan ?? 0),
                        riwayatPembayaran: 'Belum ada data',
                    } as any,
                });
                nasabahId = createdNasabah.id;
            }
        }

        if (!nasabahId) {
            throw new BadRequestException('Pilih nasabah atau lengkapi nama dan NIK nasabah baru');
        }

        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: nasabahId },
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
        });

        if (!nasabah) {
            throw new NotFoundException(`Nasabah dengan ID ${nasabahId} tidak ditemukan`);
        }

        const currentBalance = await this.getCurrentBalance(nasabahId);
        const saldoSetelahSetoran = currentBalance + createSimpananDto.jumlahSetoran;
        const bungaRate = this.getBungaRateBySaldo(saldoSetelahSetoran);
        const jenisInterest = (createSimpananDto.jenisInterest || 'flat') as 'flat' | 'efektif';
        const nominalBunga = bungaRate > 0
            ? this.calculateInterest(saldoSetelahSetoran, bungaRate, jenisInterest)
            : 0;
        const saldoAkhir = saldoSetelahSetoran + nominalBunga;

        const simpananRecord = await this.prisma.simpanan.create({
            data: {
                nasabahId,
                jumlahSetoran: createSimpananDto.jumlahSetoran,
                bungaSimpanan: bungaRate,
                jenisInterest,
                tanggalSetoran: createSimpananDto.tanggalSetoran || new Date(),
                saldoAkhir,
                status: 'aktif',
                keterangan: createSimpananDto.keterangan || 'Setoran simpanan',
            },
        });

        if (nominalBunga > 0) {
            await this.prisma.transaksiBunga.create({
                data: {
                    simpananId: simpananRecord.id,
                    nominalBunga,
                    tanggalTransaksi: new Date(),
                },
            });
        }

        return simpananRecord;
    }

    /**
     * Withdraw savings (create withdrawal record)
     */
    async withdraw(nasabahId: number, jumlahPenarikan: number, keterangan?: string) {
        const currentBalance = await this.getCurrentBalance(nasabahId);

        if (jumlahPenarikan > currentBalance) {
            throw new BadRequestException(
                `Saldo tidak mencukupi. Saldo saat ini: Rp${currentBalance.toLocaleString('id-ID')}`,
            );
        }

        const saldoAkhir = currentBalance - jumlahPenarikan;

        return await this.prisma.simpanan.create({
            data: {
                nasabahId,
                jumlahSetoran: -jumlahPenarikan, // Negative value for withdrawal
                saldoAkhir,
                status: 'ditarik',
                keterangan: keterangan || 'Penarikan dana',
            },
        });
    }

    /**
     * Calculate and apply interest to savings
     */
    async applyInterest(nasabahId: number) {
        const currentBalance = await this.getCurrentBalance(nasabahId);

        if (currentBalance === 0) {
            throw new BadRequestException('Tidak ada saldo untuk dihitung bunganya');
        }

        // Find latest active savings to get interest rate
        const latestSimpanan = await this.prisma.simpanan.findFirst({
            where: {
                nasabahId,
                status: 'aktif',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!latestSimpanan || !latestSimpanan.bungaSimpanan) {
            throw new BadRequestException('Tidak ada data bunga untuk nasabah ini');
        }

        // Calculate interest
        const interest = this.calculateInterest(
            currentBalance,
            latestSimpanan.bungaSimpanan,
            (latestSimpanan.jenisInterest as 'flat' | 'efektif') || 'flat',
        );

        const saldoAkhir = currentBalance + interest;

        // Create interest transaction record
        const simpananRecord = await this.prisma.simpanan.create({
            data: {
                nasabahId,
                jumlahSetoran: interest,
                saldoAkhir,
                status: 'aktif',
                keterangan: 'Bunga tabungan',
            },
        });

        // Record interest transaction
        await this.prisma.transaksiBunga.create({
            data: {
                simpananId: simpananRecord.id,
                nominalBunga: interest,
                tanggalTransaksi: new Date(),
            },
        });

        return simpananRecord;
    }

    /**
     * Get all savings records
     */
    async findAll(): Promise<ListSimpananDto[]> {
        return this.prisma.simpanan.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        }) as Promise<ListSimpananDto[]>;
    }

    /**
     * Get all savings records paginated
     */
    async findAllPaginated(
        nasabahId: number,
        page: number = 1,
        limit: number = 10,
    ): Promise<PaginatedSimpananResponse> {
        const skip = (page - 1) * limit;

        const total = await this.prisma.simpanan.count({
            where: { nasabahId },
        });

        const data = await this.prisma.simpanan.findMany({
            where: { nasabahId },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
        });

        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            data: data as ListSimpananDto[],
            total,
            page,
            limit,
            totalPages,
            hasNextPage,
            hasPrevPage,
        };
    }

    /**
     * Get savings summary for a customer
     */
    async getSimpananSummary(nasabahId: number) {
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: nasabahId },
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
        });

        if (!nasabah) {
            throw new NotFoundException(`Nasabah dengan ID ${nasabahId} tidak ditemukan`);
        }

        const currentBalance = await this.getCurrentBalance(nasabahId);

        const totalDeposit = await this.prisma.simpanan.aggregate({
            where: {
                nasabahId,
                status: 'aktif',
                jumlahSetoran: { gt: 0 },
            },
            _sum: { jumlahSetoran: true },
        });

        const totalWithdraw = await this.prisma.simpanan.aggregate({
            where: {
                nasabahId,
                status: 'ditarik',
                jumlahSetoran: { lt: 0 },
            },
            _sum: { jumlahSetoran: true },
        });

        const interestRecords = await this.prisma.transaksiBunga.findMany({
            where: {
                simpanan: { nasabahId },
            },
        });

        const totalInterest = interestRecords.reduce((sum, record) => sum + record.nominalBunga, 0);

        return {
            nasabahId,
            namaLengkap: nasabah.nama,
            saldoSaatIni: currentBalance,
            totalSetoran: totalDeposit._sum.jumlahSetoran || 0,
            totalPenarikan: Math.abs(totalWithdraw._sum.jumlahSetoran || 0),
            totalBungaTerkumpul: totalInterest,
            jumlahTransaksi: await this.prisma.simpanan.count({ where: { nasabahId } }),
        };
    }

    /**
     * Find one savings record by ID
     */
    async findOne(id: number) {
        const simpanan = await this.prisma.simpanan.findUnique({
            where: { id },
            include: {
                nasabah: {
                    select: {
                        id: true,
                        nama: true,
                        nik: true,
                        pekerjaan: true,
                    },
                },
                transaksiBunga: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!simpanan) {
            throw new NotFoundException(`Simpanan dengan ID ${id} tidak ditemukan`);
        }

        return simpanan;
    }

    /**
     * Update savings record
     */
    async update(id: number, updateSimpananDto: UpdateSimpananDto) {
        await this.findOne(id); // Verify exists

        return await this.prisma.simpanan.update({
            where: { id },
            data: updateSimpananDto,
        });
    }

    /**
     * Delete savings record
     */
    async delete(id: number) {
        await this.findOne(id); // Verify exists

        return await this.prisma.simpanan.delete({
            where: { id },
        });
    }
}
