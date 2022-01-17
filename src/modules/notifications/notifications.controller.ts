import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';

@Controller('api/notifications')
@ApiTags('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  findAll(@Query('lastNotificationId') lastNotificationId = 0, @Request() req) {
    const tokenData = req.user;
    return this.notificationsService.findAll(+lastNotificationId, tokenData.id);
  }

  @Post(':notificationId/ack')
  @UseGuards(JwtAuthGuard)
  addMessage(@Param('notificationId') notificationId: number, @Request() req) {
    const tokenData = req.user;
    return this.notificationsService.setAcknowledged(
      +notificationId,
      +tokenData.id,
    );
  }

  @Post('read-all')
  @UseGuards(JwtAuthGuard)
  markAsRead(@Request() req) {
    const tokenData = req.user;
    return this.notificationsService.markNotifications(tokenData.id);
  }
}
