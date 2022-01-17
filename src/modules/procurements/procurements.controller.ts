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
import { ProcurementsService } from './procurements.service';
import { CreateProcurementDto } from './dto/create-procurement.dto';
import { UpdateProcurementDto } from './dto/update-procurement.dto';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/roles.decorator';
import { UserRole } from '../authentication/enums/user-roles.enum';
import { ProcurementStatus } from './enum/procurement-status.enum';
import { SubmitProcurementProposalDto } from './dto/submit-procurement-proposal.dto';
import { OrganizationTypes } from '../organizations/enums/organization-types.enum';
import { AddMessageDto } from '../chat/dto/add-message.dto';
import { ChatTypes } from '../chat/enums/chat-types.enum';
import { UpdateWorkFinishedDto } from './dto/update-work-finished.dto';

@Controller('api/procurements')
export class ProcurementsController {
  constructor(private readonly procurementsService: ProcurementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createProcurementDto: CreateProcurementDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.procurementsService.create(createProcurementDto, tokenData.id);
  }

  @Post(':id/workFinished')
  @UseGuards(JwtAuthGuard)
  updateResolved(
    @Param('id') id: number,
    @Body() updateWorkFinishedDto: UpdateWorkFinishedDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.procurementsService.updateWorkFinished(
      id,
      updateWorkFinishedDto,
      tokenData.id,
    );
  }

  @Get('/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard)
  getProcurementsForUserByProjectId(
    @Query('page') page = 0,
    @Query('limit') limit = 0,
    @Query('status') status: ProcurementStatus,
    @Query('order') order: string,
    @Query('filter') filter: string,
    @Query('search') search: string,
    @Request() req: any,
    @Param('projectId') projectId: string,
  ) {
    const tokenData = req.user;
    return this.procurementsService.getProcurementsForUserByProjectId(
      page,
      limit,
      tokenData.id,
      +projectId,
      status,
      order,
      filter,
      search,
    );
  }

  @Get('/statistics/by-project-id/:projectId')
  @UseGuards(JwtAuthGuard)
  getStatisticsByProjectId(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Query('filter') filter: string,
    @Query('search') search: string,
  ) {
    const tokenData = req.user;
    return this.procurementsService.getStatistics(
      +projectId,
      tokenData.id,
      filter,
      search,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    const tokenData = req.user;

    return this.procurementsService.findOne(+id, tokenData.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateProcurementDto: UpdateProcurementDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.procurementsService.update(
      +id,
      updateProcurementDto,
      tokenData.id,
    );
  }

  @Post('/submit-proposal/:id')
  @UseGuards(JwtAuthGuard)
  submitProposal(
    @Param('id') id: string,
    @Body() submitProcurementProposalDto: SubmitProcurementProposalDto,
    @Request() req: any,
  ) {
    const tokenData = req.user;
    return this.procurementsService.submitProposal(
      +id,
      submitProcurementProposalDto,
      tokenData.id,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.procurementsService.remove(+id);
  }

  // chat related
  @Get(':procurementId/chats/:chatId/messages')
  @UseGuards(JwtAuthGuard)
  getAllMessages(
    @Param('procurementId') procurementId: number,
    @Param('chatId') chatId: number,
    @Query('lastMessageId') lastMessageId = 0,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.procurementsService.getChatMessages(
      +procurementId,
      +chatId,
      +lastMessageId,
      +tokenData.id,
    );
  }

  @Post(':procurementId/chats/:chatId/messages')
  @UseGuards(JwtAuthGuard)
  addMessage(
    @Param('procurementId') procurementId: number,
    @Param('chatId') chatId: number,
    @Body() addMessageDto: AddMessageDto,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.procurementsService.addMessage(
      addMessageDto,
      +procurementId,
      +chatId,
      +tokenData.id,
    );
  }

  @Delete(':procurementId/chats/:chatId/messages/:messageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  deleteMessage(
    @Param('chatId') chatId: number,
    @Param('messageId') messageId: number,
    @Param('procurementId') procurementId: number,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.procurementsService.deleteMessage(
      +procurementId,
      +chatId,
      +messageId,
      tokenData.id,
    );
  }

  @Post(':procurementId/chats/:chatId/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.projectManager, UserRole.admin, UserRole.superAdmin)
  addParticipantToChat(
    @Param('chatId') chatId: number,
    @Body('userId') userId: number,
    @Param('procurementId') procurementId: number,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.procurementsService.addParticipantToChat(
      procurementId,
      chatId,
      userId,
      tokenData.id,
    );
  }

  @Delete(':procurementId/chats/:chatId/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.projectManager, UserRole.admin, UserRole.superAdmin)
  removeParticipantFromChat(
    @Param('chatId') chatId: number,
    @Body('userId') userId: number,
    @Param('procurementId') procurementId: number,
    @Request() req,
  ) {
    const tokenData = req.user;
    return this.procurementsService.removeParticipantFromChat(
      procurementId,
      chatId,
      userId,
      tokenData.id,
    );
  }

  @Get('/available-participants/:id/by-chat-type/:chatType')
  getAllAvailableParticipantsForTicketChat(
    @Param('id') id: string,
    @Param('chatType') chatType: ChatTypes,
  ) {
    return this.procurementsService.getAllAvailableParticipantsForProcurementChat(
      +id,
      chatType,
    );
  }
}
