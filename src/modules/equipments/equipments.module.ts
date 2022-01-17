import { Module } from '@nestjs/common';
import { EquipmentsService } from './equipments.service';
import { EquipmentsController } from './equipments.controller';
import { AppConfigModule } from '../configuration/configuration.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from '../buildings/entities/building.entity';
import { BuildingLevel } from '../buildings/entities/building-level.entity';
import { BuildingRoom } from '../buildings/entities/building-room.entity';
import { EquipmentInput } from './entities/equipment-input.entity';
import { EquipmentModel } from './entities/equipment-model.entity';
import { EquipmentCategoryGroup } from './entities/equipment-category-group.entity';
import { EquipmentProjectCategory } from './entities/equipment-project-category.entity';
import { Manufacturer } from './entities/manufacturer.entity';
import { Equipment } from './entities/equipment.entity';
import { EquipmentModelsService } from './equipment-models.service';
import { EquipmentProjectCategoriesService } from './equipment-project-categories.service';
import { EquipmentCategoryGroupsService } from './equipment-category-groups.service';
import { ManufacturersService } from './manufacturers.service';
import { Project } from '../projects/entities/project.entity';
import { StandardEquipmentCategoryGroup } from '../standard-procedures/entities/standard-equipment-category-group';
import { StandardProcedure } from '../standard-procedures/entities/standard-procedure';
import { StandardOperation } from '../standard-procedures/entities/standard-operation';
import { StandardOperationLabel } from '../standard-procedures/entities/standard-operation-label';
import { StandardOperationParameter } from '../standard-procedures/entities/standard-operation-parameter';
import { MaintenanceProcedure } from '../maintenance-procedures/entities/maintenance-procedure';
import { MaintenanceOperation } from '../maintenance-procedures/entities/maintenance-operation';
import { MaintenanceOperationLabel } from '../maintenance-procedures/entities/maintenance-operation-label';
import { MaintenanceOperationParameter } from '../maintenance-procedures/entities/maintenance-operation-parameter';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { PmpEventsModule } from '../pmp-events/pmp-events.module';
import { File } from '../files/entities/file.entity';

@Module({
  imports: [
    AppConfigModule,
    PmpEventsModule,
    TypeOrmModule.forFeature([
      Building,
      BuildingLevel,
      BuildingRoom,
      EquipmentInput,
      EquipmentModel,
      EquipmentCategoryGroup,
      EquipmentProjectCategory,
      Manufacturer,
      Equipment,
      Project,
      StandardEquipmentCategoryGroup,
      StandardProcedure,
      StandardOperation,
      StandardOperationLabel,
      StandardOperationParameter,
      MaintenanceProcedure,
      MaintenanceOperation,
      MaintenanceOperationLabel,
      MaintenanceOperationParameter,
      User,
      Organization,
      File,
    ]),
  ],
  controllers: [EquipmentsController],
  providers: [
    EquipmentsService,
    EquipmentModelsService,
    EquipmentProjectCategoriesService,
    EquipmentCategoryGroupsService,
    ManufacturersService,
  ],
  exports: [
    EquipmentsService,
    EquipmentModelsService,
    EquipmentProjectCategoriesService,
    EquipmentCategoryGroupsService,
    ManufacturersService,
  ],
})
export class EquipmentsModule {}
