import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { AppConfigModule } from '../configuration/configuration.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { Country } from '../geoLocation/entities/country.entity';
import { City } from '../geoLocation/entities/city.entity';
import { Project } from './entities/project.entity';
import { StandardEquipmentProjectCategory } from '../standard-procedures/entities/standard-equipment-project-category';
import { EquipmentProjectCategory } from '../equipments/entities/equipment-project-category.entity';
import { PmpEvent } from '../pmp-events/entities/pmp-event.entity';
import { PmpEventMeasurement } from '../pmp-events/entities/pmp-event-measurement.entity';
import { File } from '../files/entities/file.entity';
import { Device } from './entities/device.entity';
import { MaintenanceProceduresModule } from '../maintenance-procedures/maintenance-procedures.module';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    AppConfigModule,
    MaintenanceProceduresModule,
    UsersModule,
    ChatModule,
    TypeOrmModule.forFeature([
      Organization,
      User,
      Country,
      City,
      Project,
      StandardEquipmentProjectCategory,
      EquipmentProjectCategory,
      PmpEvent,
      File,
      Device,
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
