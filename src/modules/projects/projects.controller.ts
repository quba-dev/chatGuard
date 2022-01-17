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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Roles } from '../authentication/roles.decorator';
import {
  ProviderOrgRoles,
  UserRole,
} from '../authentication/enums/user-roles.enum';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { AssignUserToProjectDto } from './dto/assign-user-to-project.dto';
import { RemoveUserFromProjectDto } from './dto/remove-user-from-project.dto';
import { ApiTags } from '@nestjs/swagger';
import { ProjectStatus } from './enums/project-status.enum';
import { AssignDeviceToProjectDto } from './dto/assign-device-to-project.dto';
import { AddDeviceParams } from '../procurements/dto/add-device-params';
import { OrganizationTypes } from '../organizations/enums/organization-types.enum';

@Controller('api/projects')
@ApiTags('api/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.coordinator)
  create(@Body() createProjectDto: CreateProjectDto, @Request() req: any) {
    const tokenData = req.user;
    return this.projectsService.create(createProjectDto, tokenData.id);
  }

  @Post('/assign-device-to-project')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.admin,
    UserRole.coordinator,
    UserRole.projectManager,
    UserRole.assistantProjectManager,
  )
  assignDeviceToProject(
    @Query() addDeviceParams: AddDeviceParams,
    @Body() assignDeviceToProjectDto: AssignDeviceToProjectDto,

    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.projectsService.assignDeviceToProject(
      assignDeviceToProjectDto.projectId,
      tokenData.id,
      addDeviceParams.deviceId,
    );
  }

  @Get('/technicians-in-project/:uuid')
  getTechniciansInProject(@Param('uuid') uuid: string) {
    return this.projectsService.getTechniciansInProject(uuid);
  }

  @Post('/assign-user-to-project')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.coordinator)
  assignUserToProject(
    @Body() assignUserToProjectDto: AssignUserToProjectDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.projectsService.assignUserToProject(
      assignUserToProjectDto.userId,
      assignUserToProjectDto.projectId,
      tokenData.id,
    );
  }

  @Post('/remove-user-from-project')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.coordinator)
  removeUserFromProject(
    @Body() removeUserFromProjectDto: RemoveUserFromProjectDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.projectsService.removeUserFromProject(
      removeUserFromProjectDto.userId,
      removeUserFromProjectDto.projectId,
      tokenData.id,
    );
  }

  @Post('/activate/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.coordinator)
  activateProject(@Param('projectId') projectId: number, @Request() req: any) {
    const tokenData = req.user;
    return this.projectsService.activateProject(projectId, tokenData.id);
  }

  @Get('/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  getProjectStatisticsForUser(
    @Query('page') page = 0,
    @Query('limit') limit = 0,
    @Request() req: any,
    @Query('status') status: ProjectStatus,
  ) {
    const tokenData = req.user;
    return this.projectsService.getProjectStatisticsForUser(
      page,
      limit,
      tokenData.id,
      status,
    );
  }

  @Get('/dashboard-stats/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  getStatsByProjectId(@Param('projectId') projectId: number) {
    return this.projectsService.getDashboardStatsByProjectId(projectId);
  }

  @Get('/users-stats/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  getUserStatsByProjectId(@Param('projectId') projectId: number) {
    return this.projectsService.getUserStatsByProjectId(projectId);
  }

  @Get('/')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  getProjectsForUser(
    @Query('page') page = 0,
    @Query('limit') limit = 0,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.projectsService.getProjectsForUser(page, limit, tokenData.id);
  }

  @Get('/statistics-for-associated-projects')
  @UseGuards(JwtAuthGuard)
  getProjectStatisticsOnlyForAssociatedProjects(
    @Query('page') page = 0,
    @Query('limit') limit = 0,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.projectsService.getProjectStatisticsOnlyForAssociatedProjects(
      page,
      limit,
      tokenData.id,
    );
  }

  @Get('/public-info/:id')
  @UseGuards(JwtAuthGuard)
  getPublicInfo(@Param('id') id: string) {
    return this.projectsService.getPublicInfo(+id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    const tokenData = req.user;
    return this.projectsService.findOne(+id, tokenData.id);
  }

  @Get(':id/associated-organizations')
  @UseGuards(JwtAuthGuard)
  getAssociatedOrgs(@Param('id') id: string, @Request() req: any) {
    const tokenData = req.user;
    return this.projectsService.getAssociatedOrgs(+id, tokenData.id);
  }

  @Get(':id/associated-users/by-organization-id/:organizationId')
  @UseGuards(JwtAuthGuard)
  getAssociatedUsers(
    @Param('id') id: string,
    @Param('organizationId') organizationId: string,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.projectsService.getAssociatedUsers(
      +id,
      +organizationId,
      tokenData.id,
    );
  }

  @Get(':id/associated-users/by-organization-type/:organizationType')
  @UseGuards(JwtAuthGuard)
  getAssociatedUsersByOrganizationType(
    @Param('id') id: string,
    @Param('organizationType') organizationType: OrganizationTypes,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.projectsService.getAssociatedUsersByOrganizationType(
      +id,
      organizationType,
      tokenData.id,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.projectsService.update(+id, updateProjectDto, tokenData.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.superAdmin, UserRole.admin)
  remove(@Param('id') id: string) {
    return this.projectsService.remove(+id);
  }

  @Patch('/refresh-project-updated-at/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  refreshGlobalUpdatedAt(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.refreshGlobalUpdatedAt(+id);
  }
}
