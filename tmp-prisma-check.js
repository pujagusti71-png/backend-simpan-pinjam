const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve('.env'), override: true });
const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log('connected');
    return prisma.$disconnect();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
