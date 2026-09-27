import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        const rawConnectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
        if (!rawConnectionString) {
            console.error('\n======================================================');
            console.error('CRITICAL ERROR: DATABASE_URL is not configured!');
            console.error('Silakan buka tab "Variables" di Railway dan tambahkan DATABASE_URL.');
            console.error('======================================================\n');
        }

        let connectionString = rawConnectionString || '';
        const poolOptions: Record<string, unknown> = {
            connectionString,
            keepAlive: true,
        };

        if (connectionString) {
            try {
                const url = new URL(connectionString);
                if (!url.searchParams.has('sslmode')) {
                    url.searchParams.set('sslmode', 'require');
                }
                url.searchParams.set('uselibpqcompat', 'true');
                connectionString = url.toString();
                poolOptions.connectionString = connectionString;

                if (connectionString.includes('supabase.com')) {
                    const supabaseHost = process.env.SUPABASE_HOST;
                    poolOptions.ssl = {
                        rejectUnauthorized: false,
                        servername: supabaseHost || url.hostname,
                    };
                } else if (process.env.NODE_ENV === 'production' || process.env.DATABASE_SSL === 'true') {
                    poolOptions.ssl = {
                        rejectUnauthorized: false,
                    };
                }
            } catch (err) {
                console.warn('Could not parse database URL for custom SSL configuration:', err);
            }
        }

        const pool = new Pool(poolOptions);
        const adapter = new PrismaPg(pool);
        super({
            adapter,
            errorFormat: 'pretty',
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Database connected successfully.');
        } catch (error) {
            this.logger.error('Failed to connect to database. Make sure DATABASE_URL is correct and active.', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
