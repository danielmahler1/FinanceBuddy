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
import { GoalService } from './goal.service';
import { CreateGoalDto } from '@repo/api/goal/dto/create-goal.dto';
import { UpdateGoalDto } from '@repo/api/goal/dto/update-goal.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/jwt.strategy';

@Controller('goals')
@UseGuards(AuthGuard('jwt'))
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.goalService.findAllForUser(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.goalService.findOne(id, user.userId);
  }

  @Post()
  create(@Body() createGoalDto: CreateGoalDto, @CurrentUser() user: JwtUser) {
    return this.goalService.create({ ...createGoalDto, userId: user.userId });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.goalService.update(id, updateGoalDto, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.goalService.remove(id, user.userId);
  }
}

