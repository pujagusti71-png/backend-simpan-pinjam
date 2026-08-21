require('dotenv').config();

module.exports = {
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'npx ts-node prisma/seed.ts',
  },
};