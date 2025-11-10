import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTransactionDto } from '@repo/api/transaction/dto/create-transaction.dto';
import { UpdateTransactionDto } from '@repo/api/transaction/dto/update-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.transaction.findMany();
  }

  async findAllForUser(userId: string) {
    return this.prisma.transaction.findMany({
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
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        account: true,
      },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    if (transaction.account.userId !== userId) {
      throw new ForbiddenException('You do not have access to this transaction');
    }
    return transaction;
  }

  async create(createTransactionDto: CreateTransactionDto, userId: string) {
    // Verify the account belongs to the user
    const account = await this.prisma.account.findUnique({
      where: { id: createTransactionDto.accountId },
    });
    if (!account || account.userId !== userId) {
      throw new ForbiddenException('You do not have access to this account');
    }
    return this.prisma.transaction.create({
      data: createTransactionDto,
    });
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto, userId: string) {
    await this.findOne(id, userId); // Check if transaction exists and user owns it
    return this.prisma.transaction.update({
      where: { id },
      data: updateTransactionDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Check if transaction exists and user owns it
    return this.prisma.transaction.delete({
      where: { id },
    });
  }
}

