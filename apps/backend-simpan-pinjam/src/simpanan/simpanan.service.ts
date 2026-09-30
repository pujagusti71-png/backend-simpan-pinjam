import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSimpananDto, UpdateSimpananDto, ListSimpananDto, PaginatedSimpananResponse } from './dto';

@Injectable()
export class SimpananService {
    constructor(private prisma: PrismaService) { }

    /**
     * Suku bunga simpanan tahunan berjenjang (p.a.) standar koperasi simpan pinjam:
     * - < Rp 1.000.000: 0% (saldo minimum)
     * - Rp 1.000.000 s/d Rp 10.000.000: 2.0% p.a. (~0.167% / bln)
     * - > Rp 10.000.000 s/d Rp 50.000.000: 3.0% p.a. (~0.25% / bln)
     * - > Rp 50.000.000 s/d Rp 100.000.000: 3.75% p.a. (~0.3125% / bln)
     * - > Rp 100.000.000: 4.5% p.a. (~0.375% / bln)
     */
    public getAnnualInterestRate(saldo: number): number {
        if (saldo < 1_000_000) return 0;
        if (saldo <= 10_000_000) return 2.0;
        if (saldo <= 50_000_000) return 3.0;
        if (saldo <= 100_000_000) return 3.75;
        return 4.5;
    }

    public calculateMonthlyInterest(
        saldo: number,
        annualRate: number,
    ): number {
        if (saldo < 1_000_000 || annualRate <= 0) return 0;
        const monthlyInterest = (saldo * (annualRate / 100)) / 12;
        return Math.round(monthlyInterest);
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
     * Catatan: Setoran tunai menambah saldo murni, tanpa bunga instan di hari yang sama.
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
        const annualRate = this.getAnnualInterestRate(saldoSetelahSetoran);
        const jenisInterest = (createSimpananDto.jenisInterest || 'efektif') as 'flat' | 'efektif';
        // Saldo akhir murni bertambah sebesar setoran (bunga dibagikan secara berkala bulanan)
        const saldoAkhir = saldoSetelahSetoran;

        const simpananRecord = await this.prisma.simpanan.create({
            data: {
                nasabahId,
                jumlahSetoran: createSimpananDto.jumlahSetoran,
                bungaSimpanan: annualRate,
                jenisInterest,
                tanggalSetoran: createSimpananDto.tanggalSetoran || new Date(),
                saldoAkhir,
                status: 'aktif',
                keterangan: createSimpananDto.keterangan || 'Setoran simpanan',
            },
        });

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
     * Calculate and apply monthly interest for a single customer
     */
    async applyInterest(nasabahId: number) {
        const currentBalance = await this.getCurrentBalance(nasabahId);

        if (currentBalance < 1_000_000) {
            throw new BadRequestException('Saldo belum mencapai batas minimum untuk mendapatkan bunga (minimal Rp 1.000.000)');
        }

        const annualRate = this.getAnnualInterestRate(currentBalance);
        const monthlyInterest = this.calculateMonthlyInterest(currentBalance, annualRate);

        if (monthlyInterest <= 0) {
            throw new BadRequestException('Bunga bernilai 0 untuk saldo saat ini');
        }

        const now = new Date();
        const namaBulanList = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const labelPeriode = `${namaBulanList[now.getMonth()]} ${now.getFullYear()}`;
        const saldoAkhir = currentBalance + monthlyInterest;

        const simpananRecord = await this.prisma.simpanan.create({
            data: {
                nasabahId,
                jumlahSetoran: monthlyInterest,
                bungaSimpanan: annualRate,
                jenisInterest: 'efektif',
                tanggalSetoran: now,
                saldoAkhir,
                status: 'aktif',
                keterangan: `Bagi Hasil / Bunga Simpanan - ${labelPeriode}`,
            },
        });

        await this.prisma.transaksiBunga.create({
            data: {
                simpananId: simpananRecord.id,
                nominalBunga: monthlyInterest,
                tanggalTransaksi: now,
            },
        });

        return simpananRecord;
    }

    /**
     * Proses pembagian bunga bulanan otomatis untuk seluruh nasabah aktif
     */
    async processMonthlyInterest(bulan?: number, tahun?: number) {
        const now = new Date();
        const targetMonth = bulan !== undefined ? bulan - 1 : now.getMonth();
        const targetYear = tahun || now.getFullYear();

        const namaBulanList = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const labelPeriode = `${namaBulanList[targetMonth]} ${targetYear}`;

        const nasabahs = await this.prisma.nasabah.findMany({
            select: { id: true, nama: true },
        });

        const rincian: Array<{
            nasabahId: number;
            nama: string;
            saldoSebelum: number;
            sukuBungaTahunan: number;
            nominalBunga: number;
            saldoSesudah: number;
            status: 'sukses' | 'dilewati_sudah_pernah' | 'dilewati_saldo_kurang';
        }> = [];

        let totalDistributed = 0;
        let successCount = 0;

        for (const n of nasabahs) {
            const currentBalance = await this.getCurrentBalance(n.id);
            if (currentBalance < 1_000_000) {
                rincian.push({
                    nasabahId: n.id,
                    nama: n.nama,
                    saldoSebelum: currentBalance,
                    sukuBungaTahunan: 0,
                    nominalBunga: 0,
                    saldoSesudah: currentBalance,
                    status: 'dilewati_saldo_kurang',
                });
                continue;
            }

            // Cek apakah sudah pernah diproses di periode ini agar tidak dobel
            const alreadyProcessed = await this.prisma.simpanan.findFirst({
                where: {
                    nasabahId: n.id,
                    keterangan: {
                        contains: labelPeriode,
                    },
                },
            });

            if (alreadyProcessed) {
                rincian.push({
                    nasabahId: n.id,
                    nama: n.nama,
                    saldoSebelum: currentBalance,
                    sukuBungaTahunan: alreadyProcessed.bungaSimpanan ?? 0,
                    nominalBunga: 0,
                    saldoSesudah: currentBalance,
                    status: 'dilewati_sudah_pernah',
                });
                continue;
            }

            const annualRate = this.getAnnualInterestRate(currentBalance);
            const monthlyInterest = this.calculateMonthlyInterest(currentBalance, annualRate);

            if (monthlyInterest <= 0) {
                continue;
            }

            const saldoAkhir = currentBalance + monthlyInterest;

            const record = await this.prisma.simpanan.create({
                data: {
                    nasabahId: n.id,
                    jumlahSetoran: monthlyInterest,
                    bungaSimpanan: annualRate,
                    jenisInterest: 'efektif',
                    tanggalSetoran: now,
                    saldoAkhir,
                    status: 'aktif',
                    keterangan: `Bagi Hasil / Bunga Simpanan - ${labelPeriode}`,
                },
            });

            await this.prisma.transaksiBunga.create({
                data: {
                    simpananId: record.id,
                    nominalBunga: monthlyInterest,
                    tanggalTransaksi: now,
                },
            });

            totalDistributed += monthlyInterest;
            successCount++;

            rincian.push({
                nasabahId: n.id,
                nama: n.nama,
                saldoSebelum: currentBalance,
                sukuBungaTahunan: annualRate,
                nominalBunga: monthlyInterest,
                saldoSesudah: saldoAkhir,
                status: 'sukses',
            });
        }

        return {
            status: 'success',
            periode: labelPeriode,
            totalNasabahDiproses: successCount,
            totalBungaDibagikan: totalDistributed,
            rincian,
        };
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
