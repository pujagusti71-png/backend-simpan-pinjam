const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve('.env'), override: true });

async function main() {
  const rawConnectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const url = new URL(rawConnectionString);
  url.searchParams.set('sslmode', 'require');
  url.searchParams.set('uselibpqcompat', 'true');
  const connectionString = url.toString();

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
      servername: url.hostname,
    },
    keepAlive: true,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter, log: ['error'] });

  await prisma.$connect();
  const created = await prisma.nasabah.create({
    data: {
      nama: 'Test Risiko',
      nik: '9999999999999999',
      pekerjaan: 'PNS',
      penghasilan: 5000000,
      skorRisikoPekerjaan: 10,
      kategoriRisikoPekerjaan: 'Sangat Rendah',
      analisisRisikoPekerjaanId: 1,
    },
  });
  console.log(JSON.stringify(created));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
