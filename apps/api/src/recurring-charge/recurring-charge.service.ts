import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRecurringChargeDto } from './dto/create-recurring-charge.dto';
import { UpdateRecurringChargeDto } from './dto/update-recurring-charge.dto';

@Injectable()
export class RecurringChargeService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.recurringCharge.findMany();
  }

  async findOne(id: string) {
    const recurringCharge = await this.prisma.recurringCharge.findUnique({
      where: { id },
    });
    if (!recurringCharge) {
      throw new NotFoundException(`RecurringCharge with ID ${id} not found`);
    }
    return recurringCharge;
  }

  async create(createRecurringChargeDto: CreateRecurringChargeDto) {
    return this.prisma.recurringCharge.create({
      data: createRecurringChargeDto,
    });
  }

  async update(
    id: string,
    updateRecurringChargeDto: UpdateRecurringChargeDto,
  ) {
    await this.findOne(id); // Check if recurringCharge exists
    return this.prisma.recurringCharge.update({
      where: { id },
      data: updateRecurringChargeDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if recurringCharge exists
    return this.prisma.recurringCharge.delete({
      where: { id },
    });
  }
}

