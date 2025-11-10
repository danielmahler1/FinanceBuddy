import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateIncomeDto } from '@repo/api/income/dto/create-income.dto';
import { UpdateIncomeDto } from '@repo/api/income/dto/update-income.dto';

@Injectable()
export class IncomeService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.income.findMany();
  }

  async findAllForUser(userId: string) {
    return this.prisma.income.findMany({
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
    const income = await this.prisma.income.findUnique({
      where: { id },
      include: {
        account: true,
      },
    });
    if (!income) {
      throw new NotFoundException(`Income with ID ${id} not found`);
    }
    if (income.account.userId !== userId) {
      throw new ForbiddenException('You do not have access to this income');
    }
    return income;
  }

  async create(createIncomeDto: CreateIncomeDto, userId: string) {
    // Verify the account belongs to the user
    const account = await this.prisma.account.findUnique({
      where: { id: createIncomeDto.accountId },
    });
    if (!account || account.userId !== userId) {
      throw new ForbiddenException('You do not have access to this account');
    }
    return this.prisma.income.create({
      data: createIncomeDto,
    });
  }

  async update(id: string, updateIncomeDto: UpdateIncomeDto, userId: string) {
    await this.findOne(id, userId); // Check if income exists and user owns it
    return this.prisma.income.update({
      where: { id },
      data: updateIncomeDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Check if income exists and user owns it
    return this.prisma.income.delete({
      where: { id },
    });
  }
}

