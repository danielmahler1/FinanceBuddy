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
import { AccountService } from './account.service';
import { CreateAccountDto } from '@repo/api/account/dto/create-account.dto';
import { UpdateAccountDto } from '@repo/api/account/dto/update-account.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/jwt.strategy';

@Controller('accounts')
@UseGuards(AuthGuard('jwt'))
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.accountService.findAllForUser(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.accountService.findOne(id, user.userId);
  }

  @Post()
  create(@Body() createAccountDto: CreateAccountDto, @CurrentUser() user: JwtUser) {
    return this.accountService.create({ ...createAccountDto, userId: user.userId });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.accountService.update(id, updateAccountDto, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.accountService.remove(id, user.userId);
  }
}

