import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGoalDto } from '@repo/api/goal/dto/create-goal.dto';
import { UpdateGoalDto } from '@repo/api/goal/dto/update-goal.dto';

@Injectable()
export class GoalService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.goal.findMany();
  }

  async findOne(id: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
    });
    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }
    return goal;
  }

  async create(createGoalDto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: createGoalDto,
    });
  }

  async update(id: string, updateGoalDto: UpdateGoalDto) {
    await this.findOne(id); // Check if goal exists
    return this.prisma.goal.update({
      where: { id },
      data: updateGoalDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if goal exists
    return this.prisma.goal.delete({
      where: { id },
    });
  }
}

