import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProviderOrgRoles } from '../authentication/enums/user-roles.enum';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/roles.decorator';
import { CreatePmpEventMeasurementDto } from './dto/create-pmp-event-measurement.dto';
import { CreatePmpEventOperationDataDto } from './dto/create-pmp-event-operation-data.dto';
import { GetPmpEventsByProjectIdYearlyQueryParams } from './dto/get-events-by-project-id-yearly.query-params';
import { GetPmpEventsByProjectIdQueryParams } from './dto/get-events-by-project-id.query-params';
import { UpdatePmpEventDto } from './dto/update-pmp-event.dto';
import { PmpEventsService } from './pmp-events.service';

@Controller('api/pmp-event')
@ApiTags('api/pmp-event')
export class PmpEventsController {
  constructor(private readonly pmpEventService: PmpEventsService) {}

  @Get('by-project-id/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  getEventsByProjectId(
    @Param('projectId') projectId: number,
    @Query()
    getPmpEventsByProjectIdQueryParams: GetPmpEventsByProjectIdQueryParams,
  ) {
    return this.pmpEventService.getEventsByProjectId(
      projectId,
      getPmpEventsByProjectIdQueryParams.start,
      getPmpEventsByProjectIdQueryParams.stop,
      getPmpEventsByProjectIdQueryParams.filter,
      getPmpEventsByProjectIdQueryParams.search,
    );
  }

  @Get('simplified/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  getEventsByProjectIdSimplified(
    @Param('projectId') projectId: number,
    @Query()
    getPmpEventsByProjectIdQueryParams: GetPmpEventsByProjectIdQueryParams,
  ) {
    return this.pmpEventService.getEventsByProjectIdSimplified(
      projectId,
      getPmpEventsByProjectIdQueryParams.start,
      getPmpEventsByProjectIdQueryParams.stop,
      getPmpEventsByProjectIdQueryParams.filter,
      getPmpEventsByProjectIdQueryParams.search,
    );
  }

  @Get('yearly/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  getEventsByProjectIdYearly(
    @Param('projectId') projectId: number,
    @Query()
    getPmpEventsByProjectIdYearlyQueryParams: GetPmpEventsByProjectIdQueryParams,
  ) {
    return this.pmpEventService.getEventsByProjectIdYearly(
      projectId,
      getPmpEventsByProjectIdYearlyQueryParams.start,
      getPmpEventsByProjectIdYearlyQueryParams.stop,
      getPmpEventsByProjectIdYearlyQueryParams.filter,
      getPmpEventsByProjectIdYearlyQueryParams.search,
    );
  }

  @Get('/in-progress/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  getInProgressEventsByProjectId(@Param('projectId') projectId: number) {
    return this.pmpEventService.getInProgressEventsByProjectId(projectId);
  }

  @Get('/resolved/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  getResolvedEventsByProjectId(@Param('projectId') projectId: number) {
    return this.pmpEventService.getResolvedEventsByProjectId(projectId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  findOne(@Param('id') id: number) {
    return this.pmpEventService.findOne(+id);
  }

  @Post('measurement/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  saveEventMeasurement(
    @Param('eventId') eventId: number,
    @Body() createPmpEventMeasurementDto: CreatePmpEventMeasurementDto,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.pmpEventService.saveEventMeasurement(
      eventId,
      createPmpEventMeasurementDto,
      tokenData.id,
    );
  }

  @Post('operation-data/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  saveOperationData(
    @Param('eventId') eventId: number,
    @Body() createPmpEventOperationDataDto: CreatePmpEventOperationDataDto,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.pmpEventService.saveEventOperationData(
      eventId,
      createPmpEventOperationDataDto,
      tokenData.id,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  updateEvent(
    @Param('id') id: number,
    @Body() updatePmpEventDto: UpdatePmpEventDto,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.pmpEventService.updateEvent(
      +id,
      updatePmpEventDto,
      tokenData.id,
    );
  }
}
