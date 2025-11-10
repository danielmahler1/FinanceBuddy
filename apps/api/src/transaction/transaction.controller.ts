import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from '@repo/api/transaction/dto/create-transaction.dto';
import { UpdateTransactionDto } from '@repo/api/transaction/dto/update-transaction.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/jwt.strategy';

@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.transactionService.findAllForUser(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.transactionService.findOne(id, user.userId);
  }

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto, @CurrentUser() user: JwtUser) {
    return this.transactionService.create(createTransactionDto, user.userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.transactionService.update(id, updateTransactionDto, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.transactionService.remove(id, user.userId);
  }
}

