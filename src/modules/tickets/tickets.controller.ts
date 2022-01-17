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
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/roles.decorator';
import { UserRole } from '../authentication/enums/user-roles.enum';
import { TicketStatus } from './enum/ticket-status.enum';
import { ChatTypes } from '../chat/enums/chat-types.enum';
import { UpdateResolvedDto } from './dto/update-resolved.dto';
import { AddMessageDto } from '../chat/dto/add-message.dto';
import { OrganizationTypes } from '../organizations/enums/organization-types.enum';

@Controller('api/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTicketDto: CreateTicketDto, @Request() req: any) {
    const tokenData = req.user;
    return this.ticketsService.create(createTicketDto, tokenData.id);
  }

  @Post(':id/resolved')
  @UseGuards(JwtAuthGuard)
  updateResolved(
    @Param('id') id: number,
    @Body() updateResolvedDto: UpdateResolvedDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.ticketsService.updateResolved(
      id,
      updateResolvedDto,
      tokenData.id,
    );
  }

  @Get('/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard)
  getTicketsForUserByProjectId(
    @Query('page') page = 0,
    @Query('limit') limit = 0,
    @Query('status') status: TicketStatus,
    @Query('orgType') orgType: string,
    @Query('order') order: string,
    @Query('filter') filter: string,
    @Query('search') search: string,
    @Request() req: any,
    @Param('projectId') projectId: string,
  ) {
    const tokenData = req.user;
    return this.ticketsService.getTicketsForUserByProjectId(
      page,
      limit,
      tokenData.id,
      +projectId,
      status,
      orgType,
      order,
      filter,
      search,
    );
  }

  @Get('/for-technician/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.technician)
  getTicketsForTechnicianByProjectId(
    @Query('page') page = 0,
    @Query('limit') limit = 0,
    @Query('status') status: TicketStatus,
    @Request() req: any,
    @Param('projectId') projectId: string,
  ) {
    const tokenData = req.user;
    return this.ticketsService.getTicketsForTechnicianByProjectId(
      page,
      limit,
      tokenData.id,
      +projectId,
      status,
    );
  }

  @Get('/statistics/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard)
  getStatisticsByProjectId(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Query('orgType') orgType: OrganizationTypes = null,
    @Query('filter') filter: string,
    @Query('search') search: string,
  ) {
    const tokenData = req.user;
    return this.ticketsService.getStatistics(
      +projectId,
      orgType,
      tokenData.id,
      filter,
      search,
    );
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
    return this.ticketsService.search(
      part,
      +projectId,
      tokenData.id,
      page,
      limit,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Request() req: any, @Param('id') id: string) {
    const tokenData = req.user;
    return this.ticketsService.findOne(+id, tokenData.id);
  }

  // TODO restrictions on this?
  @Get('/available-participants/:id/by-chat-type/:chatType')
  getAllAvailableParticipantsForTicketChat(
    @Param('id') id: string,
    @Param('chatType') chatType: ChatTypes,
  ) {
    return this.ticketsService.getAllAvailableParticipantsForTicketChat(
      +id,
      chatType,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.ticketsService.update(+id, updateTicketDto, tokenData.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(+id);
  }

  // chat related
  @Get(':ticketId/chats/:chatId/messages')
  @UseGuards(JwtAuthGuard)
  getAllMessages(
    @Param('ticketId') ticketId: number,
    @Param('chatId') chatId: number,
    @Query('lastMessageId') lastMessageId = 0,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.ticketsService.getChatMessages(
      +ticketId,
      +chatId,
      +lastMessageId,
      +tokenData.id,
    );
  }

  @Post(':ticketId/chats/:chatId/messages')
  @UseGuards(JwtAuthGuard)
  addMessage(
    @Param('ticketId') ticketId: number,
    @Param('chatId') chatId: number,
    @Body() addMessageDto: AddMessageDto,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.ticketsService.addMessage(
      addMessageDto,
      +ticketId,
      +chatId,
      +tokenData.id,
    );
  }

  @Delete(':ticketId/chats/:chatId/messages/:messageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  deleteMessage(
    @Param('chatId') chatId: number,
    @Param('messageId') messageId: number,
    @Param('ticketId') ticketId: number,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.ticketsService.deleteMessage(
      +ticketId,
      +chatId,
      +messageId,
      tokenData.id,
    );
  }

  @Post(':ticketId/chats/:chatId/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.projectManager, UserRole.admin, UserRole.superAdmin)
  addParticipantToChat(
    @Param('chatId') chatId: number,
    @Body('userId') userId: number,
    @Param('ticketId') ticketId: number,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.ticketsService.addParticipantToChat(
      ticketId,
      chatId,
      userId,
      tokenData.id,
    );
  }

  @Delete(':ticketId/chats/:chatId/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.projectManager, UserRole.admin, UserRole.superAdmin)
  removeParticipantFromChat(
    @Param('chatId') chatId: number,
    @Body('userId') userId: number,
    @Param('ticketId') ticketId: number,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.ticketsService.removeParticipantFromChat(
      ticketId,
      chatId,
      userId,
      tokenData.id,
    );
  }
}
