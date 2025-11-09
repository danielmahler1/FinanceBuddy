import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAccountDto } from '@repo/api/account/dto/create-account.dto';
import { UpdateAccountDto } from '@repo/api/account/dto/update-account.dto';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.account.findMany();
  }

  async findOne(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
    return account;
  }

  async create(createAccountDto: CreateAccountDto) {
    return this.prisma.account.create({
      data: createAccountDto,
    });
  }

  async update(id: string, updateAccountDto: UpdateAccountDto) {
    await this.findOne(id); // Check if account exists
    return this.prisma.account.update({
      where: { id },
      data: updateAccountDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if account exists
    return this.prisma.account.delete({
      where: { id },
    });
  }
}

