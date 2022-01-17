import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import {
  ProviderOrgRoles,
  UserRole,
} from '../authentication/enums/user-roles.enum';
import { Roles } from '../authentication/roles.decorator';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('api/users')
@ApiTags('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('/change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Body() updateOTPDto: ChangePasswordDto, @Request() req) {
    return this.usersService.changePassword(updateOTPDto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  async findAll(
    @Query('page') page = 0,
    @Query('limit') limit = 0,
    @Request() req,
  ) {
    const tokenData = req.user;
    return await this.usersService.findAll(page, limit, tokenData.id);
  }

  @Get('/by-organization-id/:organizationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  async getUsersByOrganizationId(
    @Query('page') page = 0,
    @Query('limit') limit = 0,
    @Param('organizationId') organizationId: number,
  ) {
    return await this.usersService.getUsersByOrganizationId(
      page,
      limit,
      organizationId,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req) {
    const id = req.user.id;
    return this.usersService.findOne(+id, id);
  }

  @Get('statistics/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard)
  statistics(@Request() req, @Param('projectId') projectId: number) {
    const id = req.user.id;
    return this.usersService.statistics(id, projectId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req) {
    const tokenData = req.user;
    return this.usersService.findOne(+id, tokenData.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.update(+id, updateUserDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.superAdmin, UserRole.admin)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
