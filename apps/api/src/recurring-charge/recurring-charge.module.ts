import { Module } from '@nestjs/common';
import { RecurringChargeController } from './recurring-charge.controller';
import { RecurringChargeService } from './recurring-charge.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecurringChargeController],
  providers: [RecurringChargeService],
})
export class RecurringChargeModule {}

