import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { AddMessageDto } from './dto/add-message.dto';
import { MessageTypes } from './enums/message-types.enum';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Roles } from '../authentication/roles.decorator';
import { UserRole } from '../authentication/enums/user-roles.enum';

@Controller('api/chats')
@ApiTags('api/chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('/unread-counts')
  @UseGuards(JwtAuthGuard)
  getUnreadCounts(@Query('chatId') chatIds: number[], @Request() req) {
    const tokenData = req.user;
    return this.chatService.getUnreadCounts(chatIds, tokenData.id);
  }
}
