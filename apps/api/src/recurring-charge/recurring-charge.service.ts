import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRecurringChargeDto } from '@repo/api/recurring-charge/dto/create-recurring-charge.dto';
import { UpdateRecurringChargeDto } from '@repo/api/recurring-charge/dto/update-recurring-charge.dto';

@Injectable()
export class RecurringChargeService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.recurringCharge.findMany();
  }

  async findAllForUser(userId: string) {
    return this.prisma.recurringCharge.findMany({
      where: {
        account: {
          userId,
        },
      },
      include: {
        account: true,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const recurringCharge = await this.prisma.recurringCharge.findUnique({
      where: { id },
      include: {
        account: true,
      },
    });
    if (!recurringCharge) {
      throw new NotFoundException(`RecurringCharge with ID ${id} not found`);
    }
    if (recurringCharge.account.userId !== userId) {
      throw new ForbiddenException('You do not have access to this recurring charge');
    }
    return recurringCharge;
  }

  async create(createRecurringChargeDto: CreateRecurringChargeDto, userId: string) {
    // Verify the account belongs to the user
    const account = await this.prisma.account.findUnique({
      where: { id: createRecurringChargeDto.accountId },
    });
    if (!account || account.userId !== userId) {
      throw new ForbiddenException('You do not have access to this account');
    }
    return this.prisma.recurringCharge.create({
      data: createRecurringChargeDto,
    });
  }

  async update(
    id: string,
    updateRecurringChargeDto: UpdateRecurringChargeDto,
    userId: string,
  ) {
    await this.findOne(id, userId); // Check if recurringCharge exists and user owns it
    return this.prisma.recurringCharge.update({
      where: { id },
      data: updateRecurringChargeDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Check if recurringCharge exists and user owns it
    return this.prisma.recurringCharge.delete({
      where: { id },
    });
  }

  async processDueCharges(userId: string) {
    const charges = await this.findAllForUser(userId);

    // Use UTC to avoid timezone issues
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const processedTransactions = [];

    for (const charge of charges as any[]) {
      if (!charge.status) continue; // Skip inactive charges

      // Check if charge has ended
      if (charge.endDate) {
        const endDate = new Date(charge.endDate);
        const endDateUTC = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
        if (today > endDateUTC) continue;
      }

      // Check if already processed today
      if (charge.lastProcessedDate) {
        const lastProcessed = new Date(charge.lastProcessedDate);
        const lastProcessedUTC = new Date(Date.UTC(lastProcessed.getUTCFullYear(), lastProcessed.getUTCMonth(), lastProcessed.getUTCDate()));
        if (lastProcessedUTC.getTime() === today.getTime()) {
          continue; // Already processed today
        }
      }

      // Get start date
      const startDate = new Date(charge.startDate);
      const startDateUTC = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));

      // Skip if not started yet
      if (today < startDateUTC) continue;

      // Determine what date to start processing from
      let processFromDate: Date;
      if (charge.lastProcessedDate) {
        const lastProcessed = new Date(charge.lastProcessedDate);
        processFromDate = new Date(Date.UTC(lastProcessed.getUTCFullYear(), lastProcessed.getUTCMonth(), lastProcessed.getUTCDate()));
      } else {
        // Never processed - start from day before start date
        processFromDate = new Date(startDateUTC.getTime() - 86400000); // Subtract 1 day
      }

      // Process all due dates from processFromDate to today
      let currentDate = new Date(processFromDate);

      while (currentDate < today) {
        let nextDueDate: Date | null = null;

        if (charge.interval === 'daily') {
          nextDueDate = new Date(currentDate.getTime() + 86400000); // Add 1 day
        } else if (charge.interval === 'monthly') {
          // Find next occurrence of dayOfMonth after currentDate
          // First try current month
          const currentMonthDueDate = new Date(Date.UTC(
            currentDate.getUTCFullYear(),
            currentDate.getUTCMonth(),
            charge.dayOfMonth
          ));

          if (currentMonthDueDate > currentDate) {
            // Due date in current month is after currentDate
            nextDueDate = currentMonthDueDate;
          } else {
            // Need to go to next month
            nextDueDate = new Date(Date.UTC(
              currentDate.getUTCFullYear(),
              currentDate.getUTCMonth() + 1,
              charge.dayOfMonth
            ));
          }
        } else if (charge.interval === 'yearly') {
          // Find next occurrence of monthOfYear and dayOfMonth after currentDate
          const month = charge.monthOfYear ? charge.monthOfYear - 1 : 0;

          // First try current year
          const currentYearDueDate = new Date(Date.UTC(
            currentDate.getUTCFullYear(),
            month,
            charge.dayOfMonth
          ));

          if (currentYearDueDate > currentDate) {
            // Due date in current year is after currentDate
            nextDueDate = currentYearDueDate;
          } else {
            // Need to go to next year
            nextDueDate = new Date(Date.UTC(
              currentDate.getUTCFullYear() + 1,
              month,
              charge.dayOfMonth
            ));
          }
        }

        if (!nextDueDate || nextDueDate > today) break;
        if (nextDueDate < startDateUTC) {
          currentDate = nextDueDate;
          continue;
        }

        // Create transaction for this due date
        const transaction = await this.prisma.transaction.create({
          data: {
            accountId: charge.accountId,
            type: charge.type,
            amount: charge.amount,
            vendor: charge.vendor,
            createdAt: nextDueDate,
          },
        });

        // Update account balance
        await this.prisma.account.update({
          where: { id: charge.accountId },
          data: {
            value: {
              increment: charge.amount,
            },
          },
        });

        processedTransactions.push(transaction);
        currentDate = nextDueDate;
      }

      // Update last processed date if we processed anything
      if (processedTransactions.length > 0) {
        await this.prisma.recurringCharge.update({
          where: { id: charge.id },
          data: {
            lastProcessedDate: today,
          } as any,
        });
      }
    }

    return { processed: processedTransactions.length, transactions: processedTransactions };
  }

}

