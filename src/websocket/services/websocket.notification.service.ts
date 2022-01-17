import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Notification } from '../../modules/notifications/entities/notification.entity';
import { User } from '../../modules/users/entities/user.entity';

@Injectable()
export class WebsocketNotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async helloworld() {
    // TODO: here should be some logic
  }
}
