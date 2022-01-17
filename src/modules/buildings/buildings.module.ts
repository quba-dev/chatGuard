import { Module } from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { BuildingsController } from './buildings.controller';
import { BuildingLevelsService } from './building-levels.service';
import { BuildingRoomsService } from './building-rooms.service';
import { AppConfigModule } from '../configuration/configuration.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from './entities/building.entity';
import { BuildingLevel } from './entities/building-level.entity';
import { BuildingRoom } from './entities/building-room.entity';
import { TenantLocationsService } from './tenant-locations.service';
import { TenantLocation } from './entities/tenant-location.entity';
import { Project } from '../projects/entities/project.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forFeature([
      Building,
      BuildingLevel,
      BuildingRoom,
      TenantLocation,
      Project,
      Organization,
      User,
    ]),
  ],
  controllers: [BuildingsController],
  providers: [
    BuildingsService,
    BuildingLevelsService,
    BuildingRoomsService,
    TenantLocationsService,
  ],
  exports: [BuildingsService, BuildingLevelsService, BuildingRoomsService],
})
export class BuildingsModule {}
