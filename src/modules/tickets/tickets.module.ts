import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { AppConfigModule } from '../configuration/configuration.module';
import { ChatModule } from '../chat/chat.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from '../buildings/entities/building.entity';
import { BuildingLevel } from '../buildings/entities/building-level.entity';
import { BuildingRoom } from '../buildings/entities/building-room.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { File } from '../files/entities/file.entity';
import { Ticket } from './entities/ticket.entity';
import { Chat } from '../chat/entities/chat.entity';
import { ChatParticipant } from '../chat/entities/chat-participant.entity';

@Module({
  imports: [
    AppConfigModule,
    ChatModule,
    TypeOrmModule.forFeature([
      Ticket,
      Building,
      BuildingLevel,
      BuildingRoom,
      Project,
      User,
      Organization,
      File,
      Chat,
      ChatParticipant,
    ]),
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
