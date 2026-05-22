import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
    log: ['error'],
});

async function main() {
    try {
        // Check if admin already exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { username: 'admin' },
        });

        if (existingAdmin) {
            console.log('Admin user sudah ada, skip seeding');
            return;
        }

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
