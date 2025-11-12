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
}

