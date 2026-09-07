import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    async getChartData() {
        const now = new Date();
        const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const [savings, loans] = await Promise.all([
            this.prisma.simpanan.findMany({
                where: { tanggalSetoran: { gte: firstMonth } },
                select: { jumlahSetoran: true, tanggalSetoran: true, keterangan: true },
            }),
            this.prisma.pinjaman.findMany({
                where: { tanggalPengajuan: { gte: firstMonth } },
                select: { jumlahPinjaman: true, tanggalPengajuan: true },
            }),
        ]);

        const months = Array.from({ length: 6 }, (_, index) => {
            const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
            return {
                key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                bulan: new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date),
                simpanan: 0,
                pinjaman: 0,
            };
        });
        const monthMap = new Map(months.map((month) => [month.key, month]));

        savings.forEach((item) => {
            if (item.keterangan === 'Potongan tabungan') return;
            const date = new Date(item.tanggalSetoran);
            const month = monthMap.get(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
            if (month) month.simpanan += Number(item.jumlahSetoran || 0);
        });
        loans.forEach((item) => {
            const date = new Date(item.tanggalPengajuan);
            const month = monthMap.get(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
            if (month) month.pinjaman += Number(item.jumlahPinjaman || 0);
        });

        return months.map(({ key, ...month }) => month);
    }
}