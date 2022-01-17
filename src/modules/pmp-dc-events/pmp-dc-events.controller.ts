import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PmpDcEventsService } from './pmp-dc-events.service';
import { CreatePmpDcEventDto } from './dto/create-pmp-dc-event.dto';
import { UpdatePmpDcEventDto } from './dto/update-pmp-dc-event.dto';
import { Roles } from '../authentication/roles.decorator';
import { ProviderOrgRoles } from '../authentication/enums/user-roles.enum';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { CreatePmpDCEventOperationDataDto } from './dto/create-pmp-dc-event-operation-data.dto';
import { CreatePmpDCEventMeasurementDto } from './dto/create-pmp-dc-event-measurement.dto';
import { PmpDcsService } from './pmp-dc.service';
import { GetPmpDcEventsByProjectIdQueryParams } from './dto/get-dc-events-by-project-id.query-params';

@Controller('api/pmp-dc-event')
export class PmpDcEventsController {
  constructor(
    private readonly pmpDcEventsService: PmpDcEventsService,
    private readonly pmpDcsService: PmpDcsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  create(@Body() createPmpDcEventDto: CreatePmpDcEventDto) {
    return this.pmpDcEventsService.create(createPmpDcEventDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  update(
    @Param('id') id: string,
    @Body() updatePmpDcEventDto: UpdatePmpDcEventDto,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.pmpDcEventsService.update(
      +id,
      updatePmpDcEventDto,
      tokenData.id,
    );
  }

  @Post('measurement/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  saveEventMeasurement(
    @Param('eventId') eventId: number,
    @Body() createPmpDCEventMeasurementDto: CreatePmpDCEventMeasurementDto,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.pmpDcEventsService.saveEventMeasurement(
      eventId,
      createPmpDCEventMeasurementDto,
      tokenData.id,
    );
  }

  @Post('operation-data/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  saveOperationData(
    @Param('eventId') eventId: number,
    @Body() createPmpDCEventOperationDataDto: CreatePmpDCEventOperationDataDto,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.pmpDcEventsService.saveEventOperationData(
      eventId,
      createPmpDCEventOperationDataDto,
      tokenData.id,
    );
  }

  @Get('by-project-id/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  getEventsByProjectId(
    @Param('projectId') projectId: number,
    @Query('start') start: string,
  ) {
    return this.pmpDcEventsService.getEventsByProjectId(projectId, start);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  findOne(@Param('id') id: number) {
    return this.pmpDcEventsService.findOne(+id);
  }

  @Post('/daily-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  createDailyCheck(@Body('projectId') projectId: number) {
    return this.pmpDcsService.createDailyCheckForProject(projectId);
  }

  @Get('/daily-check/validate/:dailyCheckId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  validateDailyCheck(@Param('dailyCheckId') dailyCheckId: number) {
    return this.pmpDcsService.validateDailyCheck(dailyCheckId);
  }

  @Get('/daily-check/invalidate/:dailyCheckId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  invalidateDailyCheck(@Param('dailyCheckId') dailyCheckId: number) {
    return this.pmpDcsService.invalidateDailyCheck(dailyCheckId);
  }

  @Get('/daily-check/:dailyCheckId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  getDailyCheckById(@Param('dailyCheckId') dailyCheckId: number) {
    return this.pmpDcsService.getDailyCheckById(dailyCheckId);
  }

  @Get('/daily-check/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ProviderOrgRoles)
  getDailyChecksByProjectId(
    @Param('projectId') projectId: number,
    @Query()
    getPmpDcEventsByProjectIdQueryParams: GetPmpDcEventsByProjectIdQueryParams,
  ) {
    return this.pmpDcsService.getDailyChecksByProjectId(
      projectId,
      getPmpDcEventsByProjectIdQueryParams.start,
      getPmpDcEventsByProjectIdQueryParams.stop,
      getPmpDcEventsByProjectIdQueryParams.filter,
      getPmpDcEventsByProjectIdQueryParams.search,
    );
  }
}
