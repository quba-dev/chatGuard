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
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { TicketStatus } from '../tickets/enum/ticket-status.enum';
import { WorkOrderStatus } from './enum/work-order-status.enum';

@Controller('api/work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  create(@Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.workOrdersService.create(createWorkOrderDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.update(+id, updateWorkOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workOrdersService.remove(+id);
  }

  @Get('/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard)
  getTicketsForUserByProjectId(
    @Query('page') page = 0,
    @Query('limit') limit = 0,
    @Query('status') status: WorkOrderStatus,
    @Request() req: any,
    @Param('projectId') projectId: string,
  ) {
    const tokenData = req.user;
    return this.workOrdersService.getWorkOrdersForUserByProjectId(
      page,
      limit,
      tokenData.id,
      +projectId,
      status,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    const tokenData = req.user;
    return this.workOrdersService.findOne(+id, tokenData.id);
  }
}
