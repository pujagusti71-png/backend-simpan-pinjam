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
        const nasabah = await this.prisma.nasabah.findUnique({
            where: { id: createSimpananDto.nasabahId },
        });

        if (!nasabah) {
            throw new NotFoundException(`Nasabah dengan ID ${createSimpananDto.nasabahId} tidak ditemukan`);
        }

        // Get current balance
        const currentBalance = await this.getCurrentBalance(createSimpananDto.nasabahId);

        // Calculate new balance (deposit adds to balance)
        const saldoAkhir = currentBalance + createSimpananDto.jumlahSetoran;

        return await this.prisma.simpanan.create({
            data: {
                nasabahId: createSimpananDto.nasabahId,
                jumlahSetoran: createSimpananDto.jumlahSetoran,
                bungaSimpanan: createSimpananDto.bungaSimpanan || 0,
                jenisInterest: createSimpananDto.jenisInterest || 'flat',
                tanggalSetoran: createSimpananDto.tanggalSetoran || new Date(),
                saldoAkhir,
                status: 'aktif',
                keterangan: createSimpananDto.keterangan,
            },
        });
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
