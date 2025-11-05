import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AccountModule } from './account/account.module';
import { GoalModule } from './goal/goal.module';
import { TransactionModule } from './transaction/transaction.module';
import { RecurringChargeModule } from './recurring-charge/recurring-charge.module';
import { IncomeModule } from './income/income.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AccountModule,
    GoalModule,
    TransactionModule,
    RecurringChargeModule,
    IncomeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
