import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGoalDto } from '@repo/api/goal/dto/create-goal.dto';
import { UpdateGoalDto } from '@repo/api/goal/dto/update-goal.dto';

@Injectable()
export class GoalService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.goal.findMany();
  }

  async findAllForUser(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId },
    });
  }

  async findOne(id: string, userId: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
    });
    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }
    if (goal.userId !== userId) {
      throw new ForbiddenException('You do not have access to this goal');
    }
    return goal;
  }

  async create(createGoalDto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: createGoalDto,
    });
  }

  async update(id: string, updateGoalDto: UpdateGoalDto, userId: string) {
    await this.findOne(id, userId); // Check if goal exists and user owns it
    return this.prisma.goal.update({
      where: { id },
      data: updateGoalDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Check if goal exists and user owns it
    return this.prisma.goal.delete({
      where: { id },
    });
  }
}

