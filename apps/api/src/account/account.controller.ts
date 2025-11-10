import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from '@repo/api/account/dto/create-account.dto';
import { UpdateAccountDto } from '@repo/api/account/dto/update-account.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/jwt.strategy';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  findAll() {
    return this.accountService.findAll();
  }

  @Get('me')
  getMine(@CurrentUser() user: JwtUser) {
    return this.accountService.findByUserId(user.userId);
  }

  @Get('me/summary')
  getMySummary(@CurrentUser() user: JwtUser) {
    return this.accountService.getTotalsByUserId(user.userId);
  }

  @Get(':id/transactions')
  getAccountTransactions(@Param('id') id: string) {
    return this.accountService.findTransactionsByAccountId(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountService.findOne(id);
  }

  @Post()
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountService.create(createAccountDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    return this.accountService.update(id, updateAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountService.remove(id);
  }
}

