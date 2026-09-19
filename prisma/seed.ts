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
