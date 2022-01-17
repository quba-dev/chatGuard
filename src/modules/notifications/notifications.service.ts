import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as uniq from 'lodash/uniq';
import { Connection, MoreThan, QueryRunner, Repository } from 'typeorm';
import { isEmpty } from 'class-validator';

import { WebsocketGateway } from '../../websocket/websocket.gateway';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { NotificationTypes } from './enums/notification-types.enum';
import { EmailsService } from '../emails/emails.service';
import { NotificationResponseDto } from './dto/notification-response.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private connection: Connection,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly emailsService: EmailsService,
    private readonly messageGateway: WebsocketGateway,
  ) {}

  async findAll(lastNotificationId: number, userId: number) {
    const notificationRecords = await this.notificationRepository.find({
      where: {
        userId,
        acknowledged: false,
        id: MoreThan(lastNotificationId),
      },
      order: { id: 'ASC' },
    });

    let notificationsResponse: NotificationResponseDto[] = [];

    for (const notification of notificationRecords) {
      const composedNotification =
        this.composeNotificationResponse(notification);

      notificationsResponse = [...notificationsResponse, composedNotification];
    }

    return {
      total: notificationRecords.length,
      resources: notificationsResponse,
    };
  }

  async create(
    creatorId: number,
    userId: number,
    type: NotificationTypes,
    metadata: any,
  ) {
    const notif = this.notificationRepository.create({
      creatorId: creatorId,
      userId: userId,
      type: type,
      metadata: metadata,
      acknowledged: false,
    });
    return await this.notificationRepository.save(notif);
  }

  async createTx(
    queryRunner: QueryRunner,
    creatorId: number,
    userId: number,
    type: NotificationTypes,
    metadata: any,
  ) {
    const notif = this.notificationRepository.create({
      creatorId: creatorId,
      userId: userId,
      type: type,
      metadata: metadata,
      acknowledged: false,
    });
    return await queryRunner.manager.save(notif);
  }

  async sendWebsocketNotification(
    userIds: any[],
    notification: any,
    creatorId: number,
    sendCreator: boolean,
    event: string,
  ) {
    const uniqUserIds = uniq(userIds);
    if (isEmpty(uniqUserIds)) return;
    const stringifiedNotification = JSON.stringify(notification);

    this.messageGateway.messageToAllClientsByUserId(
      uniqUserIds,
      stringifiedNotification,
      event,
      creatorId,
      sendCreator,
    );
  }

  async sendWebsocketNotificationByUserId(
    userId: number,
    event: string,
    message: any,
  ) {
    const stringifiedNotification = JSON.stringify(message);

    this.messageGateway.messageToClientByUserId(
      userId,
      event,
      stringifiedNotification,
    );
  }

  async setAcknowledged(notificationId: number, userId: number) {
    await this.notificationRepository.update(
      {
        id: notificationId,
        userId: userId,
      },
      {
        acknowledged: true,
      },
    );
  }

  async setNotified(notificationId: number) {
    await this.notificationRepository.update(
      {
        id: notificationId,
      },
      {
        notified: true,
      },
    );
  }

  async sendEmailNotifications() {
    const notificationRecords = await this.notificationRepository.find({
      where: {
        acknowledged: false,
        notified: false,
      },
      relations: ['creator', 'user'],
      take: 100,
      order: { id: 'ASC' },
    });
    let sent = 0;
    for (const notification of notificationRecords) {
      if (notification.user.sendEmails) {
        await this.emailsService.sendEmailForNotification(notification);
        await this.setNotified(notification.id);
        sent++;
      }
    }
    if (sent > 0) {
      console.info(`sent ${sent}/${notificationRecords.length} notifications`);
    }
  }

  async markNotifications(userId: number) {
    const lastNotificationId = 0;
    const notifications = await this.findAll(lastNotificationId, userId);
    const { resources } = notifications;

    for (const notification of resources) {
      await this.setAcknowledged(notification.id, userId);
    }

    return resources;
  }

  composeNotificationResponse(
    notification: Notification,
  ): NotificationResponseDto {
    const clientResponse: NotificationResponseDto = {
      id: notification.id,
      creatorId: notification.creatorId,
      createdAt: notification.createdAt,
      type: notification.type,
      creatorFirstName: notification.metadata.creatorFirstName,
      creatorLastName: notification.metadata.creatorLastName,
      metadata: notification.metadata,
    };

    delete clientResponse.metadata.creatorFirstName;
    delete clientResponse.metadata.creatorLastName;

    return clientResponse;
  }
}
