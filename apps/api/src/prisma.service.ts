import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@repo/database';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
    // In development, reuse the same client instance
    if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
      return globalForPrisma.prisma as any;
    }
  }

  async onModuleInit() {
    await this.$connect();
    // Store the instance globally in development
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = this;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
