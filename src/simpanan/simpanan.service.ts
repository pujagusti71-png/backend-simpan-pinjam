import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSimpananDto, UpdateSimpananDto, ListSimpananDto, PaginatedSimpananResponse } from './dto';

@Injectable()
export class SimpananService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get the annual interest rate based on current balance.
     *
     * 0 - 4.999.999       => 0%
     * 5.000.000 - 19.999.999 => 0.5%
     * 20.000.000 - 49.999.999 => 1%
     * 50.000.000 - 99.999.999 => 1.5%
     * >= 100.000.000     => 2%
     */
    private getAnnualInterestRate(balance: number): number {
        if (balance >= 100_000_000) return 2;
        if (balance >= 50_000_000) return 1.5;
        if (balance >= 20_000_000) return 1;
        if (balance >= 5_000_000) return 0.5;
        return 0;
    }

    private calculateMonthlyInterest(
        saldoSebelumnya: number,
        annualInterestRate: number,
    ): number {
        const monthlyInterest = (saldoSebelumnya * annualInterestRate) / 100 / 12;
        return Math.round(monthlyInterest * 100) / 100;
    }

    private formatDateToWIB(date: Date | string): string {
        const parsedDate = new Date(date);
        return parsedDate
            .toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta', hour12: false })
            .replace(' ', 'T');
    }

    private mapSimpananRecord(record: any) {
        return {
            ...record,
            tanggalSetoran: this.formatDateToWIB(record.tanggalSetoran),
        };
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
            throw new NotFoundException(`Nasabah dengan ID ${createSimpananDto.nasabahId} tidak ditemukan`);
        }

        // Get current balance
        const currentBalance = await this.getCurrentBalance(createSimpananDto.nasabahId);
        const tanggalSetoran = new Date(createSimpananDto.tanggalSetoran || new Date());

        // Calculate new balance (deposit adds to balance)
        const saldoAkhir = currentBalance + createSimpananDto.jumlahSetoran;
        const annualInterestRate = this.getAnnualInterestRate(saldoAkhir);

        const simpananRecord = await this.prisma.simpanan.create({
            data: {
                nasabahId: createSimpananDto.nasabahId,
                jumlahSetoran: createSimpananDto.jumlahSetoran,
                bungaSimpanan: annualInterestRate,
                jenisInterest: 'efektif',
                tanggalSetoran,
                createdAt: tanggalSetoran,
                updatedAt: tanggalSetoran,
                saldoAkhir,
                status: 'aktif',
                keterangan: createSimpananDto.keterangan,
            },
        });

        // Trigger interest accrual for the updated balance right after deposit.
        await this.applyInterest(createSimpananDto.nasabahId);

        return {
            id: simpananRecord.id,
            nasabahId: simpananRecord.nasabahId,
            jumlahSetoran: simpananRecord.jumlahSetoran,
            bungaSimpanan: simpananRecord.bungaSimpanan,
            jenisInterest: simpananRecord.jenisInterest,
            tanggalSetoran: this.formatDateToWIB(simpananRecord.tanggalSetoran),
            saldoAkhir: simpananRecord.saldoAkhir,
            status: simpananRecord.status,
            keterangan: simpananRecord.keterangan,
        };
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

        // Determine annual interest rate based on current balance
        const annualInterestRate = this.getAnnualInterestRate(currentBalance);
        const interest = this.calculateMonthlyInterest(
            currentBalance,
            annualInterestRate,
        );

        if (interest === 0) {
            return {
                message: 'Bunga bulan ini 0 karena saldo berada di tingkat bunga 0%',
                saldoSaatIni: currentBalance,
                annualInterestRate,
                interest: 0,
            };
        }

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
    async findAll() {
        try {
            const records = await this.prisma.simpanan.findMany({
                orderBy: {
                    createdAt: 'desc',
                },
            });
            return records.map((record) => this.mapSimpananRecord(record));
        } catch (error) {
            console.error('SimpananService.findAll error:', error);
            throw new BadRequestException('Gagal mengambil daftar simpanan');
        }
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

        const mappedData: ListSimpananDto[] = data.map((item) => {
            return {
                id: item.id,
                nasabahId: item.nasabahId,
                jumlahSetoran: item.jumlahSetoran,
                tanggalSetoran: this.formatDateToWIB(item.tanggalSetoran),
                saldoAkhir: item.saldoAkhir,
                status: item.status,
                keterangan: item.keterangan ?? undefined,
            };
        });

        return {
            data: mappedData,
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

        return this.mapSimpananRecord(simpanan);
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
