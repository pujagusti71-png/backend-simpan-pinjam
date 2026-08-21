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
  const rows = await prisma.analisisRisikoPekerjaan.findMany({
    select: { pekerjaan: true, skorRisiko: true, kategoriRisiko: true },
    take: 5,
  });
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
