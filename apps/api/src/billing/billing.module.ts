import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [BillingService, PrismaService],
  controllers: [BillingController]
})
export class BillingModule {}
