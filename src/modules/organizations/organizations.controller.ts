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
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import {
  ProviderOrgRoles,
  UserRole,
} from '../authentication/enums/user-roles.enum';
import { Roles } from '../authentication/roles.decorator';
import { ApiTags } from '@nestjs/swagger';
import { OrganizationTypes } from './enums/organization-types.enum';

@Controller('api/organizations')
@ApiTags('api/organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.organizationsService.create(
      createOrganizationDto,
      tokenData.id,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  findAll(
    @Query('page') page = 0,
    @Query('limit') limit = 0,
    @Request() req: any,
    @Query('withRelations') withRelations = '',
  ) {
    const tokenData = req.user;
    return this.organizationsService.getOrganizationsForUser(
      page,
      limit,
      tokenData.id,
      withRelations,
    );
  }

  @Get('by-type/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  findAllByType(@Param('type') type: OrganizationTypes, @Request() req: any) {
    const tokenData = req.user;
    return this.organizationsService.getOrganizationsForUserByType(
      type,
      tokenData.id,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  findOne(@Param('id') id: string, @Query('excludeRoles') excludeRoles = '') {
    return this.organizationsService.findOne(+id, excludeRoles);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;

    return this.organizationsService.update(
      +id,
      updateOrganizationDto,
      tokenData.id,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.superAdmin)
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(+id);
  }
}
