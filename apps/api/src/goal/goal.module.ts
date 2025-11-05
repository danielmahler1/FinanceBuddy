import { Module } from '@nestjs/common';
import { GoalController } from './goal.controller';
import { GoalService } from './goal.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GoalController],
  providers: [GoalService],
})
export class GoalModule {}

