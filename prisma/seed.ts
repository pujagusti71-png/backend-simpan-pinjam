import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env'), override: true });

const rawConnectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!rawConnectionString) {
    throw new Error('Missing DIRECT_URL or DATABASE_URL for seeding');
}

const url = new URL(rawConnectionString);
url.searchParams.set('sslmode', 'require');
const connectionString = url.toString();

const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('supabase.com') ? {
        rejectUnauthorized: false,
        servername: url.hostname,
    } : undefined,
    keepAlive: true,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: ['error'],
});

async function main() {
    try {
        // Check if admin already exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { username: 'admin' },
        });

        if (!existingAdmin) {
            // Hash password
            const hashedPassword = await bcrypt.hash('admin123', 10);

            // Create admin user
            const admin = await prisma.admin.create({
                data: {
                    username: 'admin',
                    password: hashedPassword,
                    email: 'admin@simpanpinjam.com',
                    namaLengkap: 'Administrator',
                    isActive: true,
                },
            });

            console.log('Admin user created successfully:', {
                id: admin.id,
                username: admin.username,
                email: admin.email,
            });
        } else {
            console.log('Admin user sudah ada, skip create admin');
        }

        const masterData = [
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

        for (const item of masterData) {
            await prisma.analisisRisikoPekerjaan.upsert({
                where: { pekerjaan: item.pekerjaan },
                update: {
                    skorRisiko: item.skorRisiko,
                    kategoriRisiko: item.kategoriRisiko,
                },
                create: item,
            });
        }

        console.log('Analisis risiko pekerjaan seeded successfully');

        const nasabahCount = await prisma.nasabah.count();
        let nasabah = await prisma.nasabah.findMany({ orderBy: { id: 'asc' } });

        if (nasabahCount === 0) {
            const sampleNasabah = [
                {
                    nama: 'Samuel Santoso',
                    nik: '3174090123456789',
                    pekerjaan: 'PNS',
                    penghasilan: 7500000,
                    saldoRataRata: 500000,
                    estimasiPengeluaran: 2500000,
                    riwayatPembayaran: 'lancar',
                    jumlahTanggungan: 2,
                },
                {
                    nama: 'Dewi Permata',
                    nik: '3275090123456789',
                    pekerjaan: 'Freelance',
                    penghasilan: 6000000,
                    saldoRataRata: 300000,
                    estimasiPengeluaran: 2000000,
                    riwayatPembayaran: 'lancar',
                    jumlahTanggungan: 1,
                },
                {
                    nama: 'Rian Setiawan',
                    nik: '3376090123456789',
                    pekerjaan: 'Petani',
                    penghasilan: 4000000,
                    saldoRataRata: 150000,
                    estimasiPengeluaran: 1800000,
                    riwayatPembayaran: 'telat',
                    jumlahTanggungan: 4,
                },
                {
                    nama: 'Nina Rahma',
                    nik: '3477090123456790',
                    pekerjaan: 'Karyawan Swasta',
                    penghasilan: 8200000,
                    saldoRataRata: 750000,
                    estimasiPengeluaran: 2800000,
                    riwayatPembayaran: 'lancar',
                    jumlahTanggungan: 2,
                },
                {
                    nama: 'Andi Wijaya',
                    nik: '3578090123456791',
                    pekerjaan: 'Wirausaha',
                    penghasilan: 9000000,
                    saldoRataRata: 650000,
                    estimasiPengeluaran: 3200000,
                    riwayatPembayaran: 'telat',
                    jumlahTanggungan: 3,
                },
            ];

            await prisma.nasabah.createMany({
                data: sampleNasabah,
            });
            nasabah = await prisma.nasabah.findMany({ orderBy: { id: 'asc' } });
            console.log('Sample nasabah data inserted successfully');
        } else {
            console.log('Data nasabah sudah ada, skip nasabah seeding');
        }

        if (nasabah.length > 0) {
            const pinjamanCount = await prisma.pinjaman.count();
            if (pinjamanCount === 0) {
                const pinjamanData = nasabah.slice(0, 4).map((item, index) => ({
                    nasabahId: item.id,
                    jumlahPinjaman: [15000000, 24000000, 32000000, 18000000][index] || 22000000,
                    tenor: [12, 18, 24, 12][index] || 12,
                    sukuBunga: [1.2, 1.4, 1.1, 1.3][index] || 1.2,
                    jenisBunga: 'efektif',
                    status: index % 2 === 0 ? 'active' : 'approved',
                    cicilanBulanan: [1350000, 1500000, 1800000, 1600000][index] || 1500000,
                    totalBunga: [1800000, 2200000, 2800000, 2000000][index] || 2000000,
                    totalPembayaran: [16800000, 26200000, 34800000, 20000000][index] || 26000000,
                    tanggalPengajuan: new Date(Date.now() - (index + 1) * 86400000 * 12),
                }));

                await prisma.pinjaman.createMany({
                    data: pinjamanData,
                });
                console.log('Sample pinjaman data inserted successfully');
            }

            const simpananCount = await prisma.simpanan.count();
            if (simpananCount === 0) {
                const simpananData = nasabah.map((item, index) => ({
                    nasabahId: item.id,
                    jumlahSetoran: [2500000, 3200000, 2100000, 4700000, 3900000][index] || 3000000,
                    bungaSimpanan: 2.5,
                    jenisInterest: 'flat',
                    tanggalSetoran: new Date(Date.now() - index * 86400000 * 8),
                    saldoAkhir: [2500000, 3200000, 2100000, 4700000, 3900000][index] || 3000000,
                    status: 'aktif',
                    keterangan: 'Setoran awal simpanan',
                }));

                await prisma.simpanan.createMany({
                    data: simpananData,
                });
                console.log('Sample simpanan data inserted successfully');
            }
        }
    } catch (error) {
        console.error('Error during seeding:', error);
        throw error;
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
        console.log('Seeding completed successfully');
    })
    .catch(async (e) => {
        console.error('Seeding failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
