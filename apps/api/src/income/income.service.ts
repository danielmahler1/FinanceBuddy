import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';

@Injectable()
export class IncomeService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.income.findMany();
  }

  async findOne(id: string) {
    const income = await this.prisma.income.findUnique({
      where: { id },
    });
    if (!income) {
      throw new NotFoundException(`Income with ID ${id} not found`);
    }
    return income;
  }

  async create(createIncomeDto: CreateIncomeDto) {
    return this.prisma.income.create({
      data: createIncomeDto,
    });
  }

  async update(id: string, updateIncomeDto: UpdateIncomeDto) {
    await this.findOne(id); // Check if income exists
    return this.prisma.income.update({
      where: { id },
      data: updateIncomeDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if income exists
    return this.prisma.income.delete({
      where: { id },
    });
  }
}

