import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfigModule } from '../modules/configuration/configuration.module';
import { ChatModule } from 'src/modules/chat/chat.module';
import { WebsocketMessengerGateway } from './controllers/websocket.messenger.gateway';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketNotificationGateway } from './controllers/websocket.notification.gateway';
import { WebsocketNotificationService } from './services/websocket.notification.service';
import { WebsocketMessengerService } from './services/websocket.messenger.service';
import { User } from '../modules/users/entities/user.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { Chat } from 'src/modules/chat/entities/chat.entity';
import { ChatMessages } from 'src/modules/chat/entities/chat-message.entity';
import { ChatParticipant } from 'src/modules/chat/entities/chat-participant.entity';
import { configValues } from '../modules/configuration';

@Global()
@Module({
  imports: [
    AppConfigModule,
    JwtModule.register({
      secret: configValues.jwt.jwtSecret,
      signOptions: { expiresIn: '3600s' },
    }),
    TypeOrmModule.forFeature([
      Notification,
      User,
      Chat,
      ChatMessages,
      ChatParticipant,
    ]),
    ChatModule,
  ],
  providers: [
    WebsocketGateway,
    WebsocketNotificationGateway,
    WebsocketNotificationService,
    WebsocketMessengerGateway,
    WebsocketMessengerService,
  ],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
