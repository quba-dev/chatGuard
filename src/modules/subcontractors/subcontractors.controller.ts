import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SubcontractorsService } from './subcontractors.service';
import { CreateSubcontractorDto } from './dto/create-subcontractor.dto';
import { UpdateSubcontractorDto } from './dto/update-subcontractor.dto';
import { SubcontractorCategoriesService } from './subcontractor-categories.service';
import { ApiTags } from '@nestjs/swagger';
import { ProviderOrgRoles } from '../authentication/enums/user-roles.enum';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/roles.decorator';

@Controller('api/subcontractors')
@ApiTags('api/subcontractors')
export class SubcontractorsController {
  constructor(
    private readonly subcontractorsService: SubcontractorsService,
    private readonly subcontractorCategoriesService: SubcontractorCategoriesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  create(@Body() createSubcontractorDto: CreateSubcontractorDto) {
    return this.subcontractorsService.create(createSubcontractorDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  findAll(@Request() req: any) {
    const tokenData = req.user;
    return this.subcontractorsService.findAll(tokenData.id);
  }

  @Get('/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  findAllInProject(@Request() req: any, @Param('projectId') projectId: number) {
    const tokenData = req.user;
    return this.subcontractorsService.findAllInProject(projectId, tokenData.id);
  }

  @Get('/subcontractor-categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  findAllSubcontractorCategories() {
    return this.subcontractorCategoriesService.findAll();
  }

  @Get('/grouped-by-subcontractor-category')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  findAllGroupedBySubcontractorCategory() {
    return this.subcontractorsService.findAllGroupedBySubcontractorCategory();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  findOne(@Param('id') id: string) {
    return this.subcontractorsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  update(
    @Param('id') id: string,
    @Body() updateSubcontractorDto: UpdateSubcontractorDto,
  ) {
    return this.subcontractorsService.update(+id, updateSubcontractorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subcontractorsService.remove(+id);
  }
}
