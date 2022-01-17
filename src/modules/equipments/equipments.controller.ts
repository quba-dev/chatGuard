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
import { EquipmentsService } from './equipments.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentModelsService } from './equipment-models.service';
import { EquipmentCategoryGroupsService } from './equipment-category-groups.service';
import { ManufacturersService } from './manufacturers.service';
import { EquipmentProjectCategoriesService } from './equipment-project-categories.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';

@Controller('api/equipments')
@ApiTags('api/equipments')
export class EquipmentsController {
  constructor(
    private readonly equipmentsService: EquipmentsService,
    private readonly equipmentModelsService: EquipmentModelsService,
    private readonly equipmentCategoryGroupsService: EquipmentCategoryGroupsService,
    private readonly equipmentProjectCategoriesService: EquipmentProjectCategoriesService,
    private readonly equipmentManufacturersService: ManufacturersService,
  ) {}

  @Get('/project-categories/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard)
  findAllProjectCategories(@Param('projectId') projectId: number) {
    return this.equipmentProjectCategoriesService.findAll(projectId);
  }

  @Get('/category-groups/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard)
  findAllCategoryGroups(@Param('projectId') projectId: number) {
    return this.equipmentCategoryGroupsService.findAll(projectId);
  }

  @Get('/project-categories-with-category-groups/:projectId')
  @UseGuards(JwtAuthGuard)
  getProjectCategoryGroupsByProjectCategories(
    @Param('projectId') projectId: number,
  ) {
    return this.equipmentsService.getProjectCategoryGroupsByProjectCategories(
      projectId,
    );
  }

  @Get('/project-categories-with-category-groups-no-counts/:projectId')
  @UseGuards(JwtAuthGuard)
  getProjectCategoryGroupsByProjectCategoriesNoCounts(
    @Param('projectId') projectId: number,
  ) {
    return this.equipmentsService.getProjectCategoryGroupsByProjectCategoriesNoCounts(
      projectId,
    );
  }

  @Post('/category-groups')
  @UseGuards(JwtAuthGuard)
  createCategoryGroup(
    @Body('projectCategoryId') projectCategoryId: number,
    @Body('name') name: string,
  ) {
    return this.equipmentCategoryGroupsService.create(projectCategoryId, name);
  }

  @Get('/category-groups/by-project-category/:projectCategoryId')
  @UseGuards(JwtAuthGuard)
  findAllCategoryGroupsByProjectCategoryId(
    @Param('projectId') projectId: number,
    @Param('projectCategoryId') projectCategoryId: number,
  ) {
    return this.equipmentCategoryGroupsService.findAllByProjectCategoryId(
      projectCategoryId,
    );
  }

  @Post('/models')
  @UseGuards(JwtAuthGuard)
  createModel(@Body('name') name: string, @Request() req) {
    const tokenData = req.user;
    return this.equipmentModelsService.create(name, tokenData.id);
  }

  @Get('/models')
  @UseGuards(JwtAuthGuard)
  findAllModels(@Request() req) {
    const tokenData = req.user;
    return this.equipmentModelsService.findAll(tokenData.id);
  }

  @Get('/models/search/:part')
  @UseGuards(JwtAuthGuard)
  searchModels(
    @Param('part') part: string,
    @Query('page') page = 0,
    @Query('limit') limit = 0,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.equipmentModelsService.search(part, tokenData.id, page, limit);
  }

  @Post('/manufacturers')
  @UseGuards(JwtAuthGuard)
  createManufacturer(@Body('name') name: string, @Request() req) {
    const tokenData = req.user;
    return this.equipmentManufacturersService.create(name, tokenData.id);
  }

  @Get('/manufacturers')
  @UseGuards(JwtAuthGuard)
  findAllManufacturers(@Request() req) {
    const tokenData = req.user;
    return this.equipmentManufacturersService.findAll(tokenData.id);
  }

  @Get('/manufacturers/search/:part')
  @UseGuards(JwtAuthGuard)
  searchManufacturers(
    @Param('part') part: string,
    @Query('page') page = 0,
    @Query('limit') limit = 0,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.equipmentManufacturersService.search(
      part,
      tokenData.id,
      page,
      limit,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createEquipmentDto: CreateEquipmentDto) {
    return this.equipmentsService.create(createEquipmentDto);
  }

  @Get('/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard)
  findAllInProject(@Param('projectId') projectId: string) {
    return this.equipmentsService.findAllInProject(+projectId);
  }

  @Get('/by-category-group-id/:categoryGroupId')
  @UseGuards(JwtAuthGuard)
  findAllByCategoryGroup(@Param('categoryGroupId') categoryGroupId: string) {
    return this.equipmentsService.findAllByCategoryGroup(+categoryGroupId);
  }

  @Get('/equipment-tree/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard)
  getProjectEquipmentTree(@Param('projectId') projectId: string) {
    return this.equipmentsService.getProjectEquipmentTree(+projectId);
  }

  @Get('/search/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard)
  searchEquipment(
    @Query('part') part: string,
    @Query('page') page = 0,
    @Query('limit') limit = 0,
    @Param('projectId') projectId: string,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.equipmentsService.search(
      part,
      +projectId,
      tokenData.id,
      page,
      limit,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Query('withRelations') withRelations = '') {
    return this.equipmentsService.findOne(+id, withRelations);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.equipmentsService.update(+id, updateEquipmentDto, tokenData.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.equipmentsService.remove(+id);
  }

  @Post('/make-readonly/:id')
  @UseGuards(JwtAuthGuard)
  makeReadonly(@Param('id') id: string) {
    return this.equipmentsService.makeReadonly(+id);
  }

  @Post('/link-equipment-to-equipment')
  linkEquipmentToEquipment(
    @Body('sourceEquipmentId') sourceEquipmentId: number,
    @Body('destinationEquipmentId') destinationEquipmentId: number,
  ) {
    return this.equipmentsService.linkEquipmentToEquipment(
      sourceEquipmentId,
      destinationEquipmentId,
    );
  }

  @Post('/unlink-equipment-from-equipment')
  unlinkEquipmentFromEquipment(
    @Body('sourceEquipmentId') sourceEquipmentId: number,
    @Body('destinationEquipmentId') destinationEquipmentId: number,
  ) {
    return this.equipmentsService.unlinkEquipmentFromEquipment(
      sourceEquipmentId,
      destinationEquipmentId,
    );
  }
}
