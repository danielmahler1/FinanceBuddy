import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { RecurringChargeService } from './recurring-charge.service';
import { CreateRecurringChargeDto } from '@repo/api/recurring-charge/dto/create-recurring-charge.dto';
import { UpdateRecurringChargeDto } from '@repo/api/recurring-charge/dto/update-recurring-charge.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('recurring-charges')
export class RecurringChargeController {
  constructor(private readonly recurringChargeService: RecurringChargeService) {}

  @Get()
  findAll() {
    return this.recurringChargeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recurringChargeService.findOne(id);
  }

  @Post()
  create(@Body() createRecurringChargeDto: CreateRecurringChargeDto) {
    return this.recurringChargeService.create(createRecurringChargeDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecurringChargeDto: UpdateRecurringChargeDto,
  ) {
    return this.recurringChargeService.update(id, updateRecurringChargeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recurringChargeService.remove(id);
  }
}

