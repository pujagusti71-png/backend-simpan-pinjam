import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const rawConnectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!rawConnectionString) {
      throw new Error('Missing DIRECT_URL or DATABASE_URL for Prisma connection');
    }

    const url = new URL(rawConnectionString);
    if (!url.searchParams.has('sslmode')) {
      url.searchParams.set('sslmode', 'require');
    }
    url.searchParams.set('uselibpqcompat', 'true');
    const connectionString = url.toString();

    const poolOptions: Record<string, unknown> = {
      connectionString,
      keepAlive: true,
    };

    // Supabase pooler may use certificates that require relaxed validation in dev.
    if (connectionString.includes('supabase.com')) {
      const supabaseHost = process.env.SUPABASE_HOST;
      poolOptions.ssl = {
        rejectUnauthorized: false,
        servername: supabaseHost || url.hostname,
      };
    }

    const pool = new Pool(poolOptions);

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}