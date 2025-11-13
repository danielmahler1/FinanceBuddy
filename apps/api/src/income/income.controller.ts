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
import { IncomeService } from './income.service';
import { CreateIncomeDto } from '@repo/api';
import { UpdateIncomeDto } from '@repo/api';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/jwt.strategy';

@Controller('incomes')
@UseGuards(AuthGuard('jwt'))
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.incomeService.findAllForUser(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.incomeService.findOne(id, user.userId);
  }

  @Post()
  create(@Body() createIncomeDto: CreateIncomeDto, @CurrentUser() user: JwtUser) {
    return this.incomeService.create(createIncomeDto, user.userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateIncomeDto: UpdateIncomeDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.incomeService.update(id, updateIncomeDto, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.incomeService.remove(id, user.userId);
  }
}

