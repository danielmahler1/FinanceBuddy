import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.transaction.findMany();
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async create(createTransactionDto: CreateTransactionDto) {
    const { accountId, amount } = createTransactionDto;
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: createTransactionDto,
      });
      if (typeof amount === 'number' && Number.isFinite(amount) && amount !== 0) {
        await tx.account.update({
          where: { id: accountId },
          data: { value: { increment: amount } },
        });
      }
      return created;
    });
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }

      const oldAccountId = existing.accountId;
      const oldAmount = existing.amount;

      const newAccountId = updateTransactionDto.accountId ?? oldAccountId;
      const newAmount =
        typeof updateTransactionDto.amount === 'number' && Number.isFinite(updateTransactionDto.amount)
          ? updateTransactionDto.amount
          : oldAmount;

      const updated = await tx.transaction.update({
        where: { id },
        data: updateTransactionDto,
      });

      if (newAccountId === oldAccountId) {
        const diff = newAmount - oldAmount;
        if (diff !== 0) {
          await tx.account.update({ where: { id: oldAccountId }, data: { value: { increment: diff } } });
        }
      } else {
        await tx.account.update({ where: { id: oldAccountId }, data: { value: { increment: -oldAmount } } });
        await tx.account.update({ where: { id: newAccountId }, data: { value: { increment: newAmount } } });
      }

      return updated;
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }

      const deleted = await tx.transaction.delete({ where: { id } });

      if (typeof existing.amount === 'number' && Number.isFinite(existing.amount) && existing.amount !== 0) {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { value: { increment: -existing.amount } },
        });
      }

      return deleted;
    });
  }
}

