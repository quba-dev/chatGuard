import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Request,
  Patch,
  Delete,
} from '@nestjs/common';
import { UserRole } from '../authentication/enums/user-roles.enum';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/roles.decorator';
import { CreateCategoryGroupDto } from './dto/create-category-group.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateOperationLabelDto } from './dto/create-operation-label.dto';
import { CreateOperationParameterDto } from './dto/create-operation-parameter.dto';
import { CreateOperationDto } from './dto/create-operation.dto';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { CreateProjectCategoryDto } from './dto/create-project-category.dto';
import { UpdateCategoryGroupDto } from './dto/update-category-group.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateOperationLabelDto } from './dto/update-operation-label.dto';
import { UpdateOperationParameterDto } from './dto/update-operation-parameter.dto';
import { UpdateOperationDto } from './dto/update-operation.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';
import { UpdateProjectCategoryDto } from './dto/update-project-category.dto';
import { StandardCategoriesService } from './standard-categories.service';
import { StandardCategoryGroupsService } from './standard-category-groups.service';
import { StandardLabelsService } from './standard-labels.service';
import { StandardOperationsService } from './standard-operations.service';
import { StandardParametersService } from './standard-parameters.service';
import { StandardProceduresService } from './standard-procedures.service';
import { StandardProjectCategoriesService } from './standard-project-categories.service';

@Controller('api/standard')
export class StandardProceduresController {
  constructor(
    private readonly standardProjectCategoriesService: StandardProjectCategoriesService,
    private readonly standardCategoriesService: StandardCategoriesService,
    private readonly standardCategoryGroupsService: StandardCategoryGroupsService,
    private readonly standardProceduresService: StandardProceduresService,
    private readonly standardOperationsService: StandardOperationsService,
    private readonly standardLabelsService: StandardLabelsService,
    private readonly standardParametersService: StandardParametersService,
  ) {}

  //project categories
  //----------------------------------------------
  @Post('/project-categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  createProjectCategory(
    @Body() createProjectCategoryDto: CreateProjectCategoryDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.standardProjectCategoriesService.createStandardProjectCategory(
      createProjectCategoryDto,
      tokenData.id,
    );
  }

  @Patch('/project-categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  updateProjectCategory(
    @Body() updateProjectCategoryDto: UpdateProjectCategoryDto,
    @Param('id') id: number,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.standardProjectCategoriesService.updateStandardProjectCategory(
      updateProjectCategoryDto,
      id,
    );
  }

  @Delete('/project-categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  removeProjectCategory(@Param('id') id: number, @Request() req: any) {
    const tokenData = req.user;
    return this.standardProjectCategoriesService.removeStandardProjectCategory(
      id,
    );
  }

  //categories
  //----------------------------------------------
  @Post('/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.standardCategoriesService.createStandardCategory(
      createCategoryDto,
      tokenData.id,
    );
  }

  @Patch('/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  updateCategory(
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Param('id') id: number,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.standardCategoriesService.updateStandardCategory(
      updateCategoryDto,
      id,
    );
  }

  @Delete('/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  removeCategory(@Param('id') id: number, @Request() req: any) {
    const tokenData = req.user;
    return this.standardCategoriesService.removeStandardCategory(id);
  }

  @Get('/categories/by-organization-id/:organizationId')
  @UseGuards(JwtAuthGuard)
  getStandardEquipmentCategories(
    @Param('organizationId') organizationId: number,
  ) {
    return this.standardCategoriesService.getStandardEquipmentCategories(
      organizationId,
    );
  }

  //category groups
  //----------------------------------------------
  @Post('/category-groups')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  createCategoryGroup(
    @Body() createCategoryGroupDto: CreateCategoryGroupDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.standardCategoryGroupsService.createStandardCategoryGroup(
      createCategoryGroupDto,
    );
  }

  @Patch('/category-groups/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  updateCategoryGroup(
    @Body() updateCategoryGroupDto: UpdateCategoryGroupDto,
    @Param('id') id: number,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.standardCategoryGroupsService.updateStandardCategoryGroup(
      updateCategoryGroupDto,
      id,
    );
  }

  @Delete('/category-groups/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  removeCategoryGroup(@Param('id') id: number, @Request() req: any) {
    const tokenData = req.user;
    return this.standardCategoryGroupsService.removeStandardCategoryGroup(id);
  }

  @Get('/category-groups/by-category-id/:categoryId')
  @UseGuards(JwtAuthGuard)
  getStandardEquipmentCategoryGroupsByCategory(
    @Param('categoryId') categoryId: number,
  ) {
    return this.standardCategoryGroupsService.getStandardEquipmentCategoryGroupsByCategory(
      categoryId,
    );
  }

  //procedures
  //----------------------------------------------
  @Post('/procedures')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  createProcedure(
    @Body() createProcedureDto: CreateProcedureDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.standardProceduresService.createStandardProcedure(
      createProcedureDto,
    );
  }

  @Patch('/procedures/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  updateProcedure(
    @Body() updateProcedureDto: UpdateProcedureDto,
    @Param('id') id: number,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.standardProceduresService.updateStandardProcedure(
      updateProcedureDto,
      id,
    );
  }

  @Delete('/procedures/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  removeProcedure(@Param('id') id: number, @Request() req: any) {
    const tokenData = req.user;
    return this.standardProceduresService.removeStandardProcedure(id);
  }

  //operations
  //----------------------------------------------
  @Post('/operations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  createOperation(
    @Body() createOperationDto: CreateOperationDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.standardOperationsService.createStandardOperation(
      createOperationDto,
    );
  }

  @Patch('/operations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  updateOperation(
    @Body() updateOperationDto: UpdateOperationDto,
    @Param('id') id: number,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.standardOperationsService.updateStandardOperation(
      updateOperationDto,
      id,
    );
  }

  @Delete('/operations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  removeOperation(@Param('id') id: number, @Request() req: any) {
    const tokenData = req.user;
    return this.standardOperationsService.removeStandardOperation(id);
  }

  //labels
  //----------------------------------------------
  @Post('/operation-labels')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  createLabel(
    @Body() createOperationLabelDto: CreateOperationLabelDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.standardLabelsService.createStandardOperationLabel(
      createOperationLabelDto,
    );
  }

  @Patch('/operation-labels/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  updateLabel(
    @Body() updateOperationLabelDto: UpdateOperationLabelDto,
    @Param('id') id: number,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.standardLabelsService.updateStandardOperationLabel(
      updateOperationLabelDto,
      id,
    );
  }

  @Delete('/operation-labels/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  removeLabel(@Param('id') id: number, @Request() req: any) {
    const tokenData = req.user;
    return this.standardLabelsService.removeStandardOperationLabel(id);
  }

  //parameters
  //----------------------------------------------
  @Post('/operation-parameters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  createParameter(
    @Body() createOperationParameterDto: CreateOperationParameterDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.standardParametersService.createStandardOperationParameter(
      createOperationParameterDto,
    );
  }

  @Patch('/operation-parameters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  updateParameter(
    @Body() updateOperationParameterDto: UpdateOperationParameterDto,
    @Param('id') id: number,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.standardParametersService.updateStandardOperationParameter(
      updateOperationParameterDto,
      id,
    );
  }

  @Delete('/operation-parameters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  removeParameter(@Param('id') id: number, @Request() req: any) {
    const tokenData = req.user;
    return this.standardParametersService.removeStandardOperationParameter(id);
  }
}
