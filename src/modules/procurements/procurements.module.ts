import { Module } from '@nestjs/common';
import { ProcurementsService } from './procurements.service';
import { ProcurementsController } from './procurements.controller';
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
import { Procurement } from './entities/procurement.entity';
import { Chat } from '../chat/entities/chat.entity';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [
    AppConfigModule,
    ChatModule,
    EmailsModule,
    TypeOrmModule.forFeature([
      Procurement,
      Building,
      BuildingLevel,
      BuildingRoom,
      Project,
      User,
      Organization,
      File,
      Chat,
    ]),
  ],
  controllers: [ProcurementsController],
  providers: [ProcurementsService],
  exports: [ProcurementsService],
})
export class ProcurementsModule {}
