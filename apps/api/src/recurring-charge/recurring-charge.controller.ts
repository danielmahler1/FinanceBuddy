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
import { RecurringChargeService } from './recurring-charge.service';
import { CreateRecurringChargeDto } from '@repo/api';
import { UpdateRecurringChargeDto } from '@repo/api';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/jwt.strategy';

@Controller('recurring-charges')
@UseGuards(AuthGuard('jwt'))
export class RecurringChargeController {
  constructor(private readonly recurringChargeService: RecurringChargeService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.recurringChargeService.findAllForUser(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.recurringChargeService.findOne(id, user.userId);
  }

  @Post()
  create(
    @Body() createRecurringChargeDto: CreateRecurringChargeDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.recurringChargeService.create(createRecurringChargeDto, user.userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecurringChargeDto: UpdateRecurringChargeDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.recurringChargeService.update(id, updateRecurringChargeDto, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.recurringChargeService.remove(id, user.userId);
  }
}

