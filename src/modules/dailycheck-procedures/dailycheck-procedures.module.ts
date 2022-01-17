import { Module } from '@nestjs/common';
import { DailycheckProceduresService } from './dailycheck-procedures.service';
import { DailycheckProceduresController } from './dailycheck-procedures.controller';
import { DailycheckOperationLabel } from './entities/dailycheck-operation-label.entity';
import { DailycheckOperationLabelsService } from './dailycheck-operation-label.service';
import { DailycheckProcedure } from './entities/dailycheck-procedure.entity';
import { DailycheckOperationParameter } from './entities/dailycheck-operation-parameter.entity';
import { DailycheckOperationParametersService } from './dailycheck-operation-parameter.service';
import { DailycheckOperation } from './entities/dailycheck-operation.entity';
import { DailycheckOperationsService } from './dailycheck-operation.service';
import { Equipment } from '../equipments/entities/equipment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../configuration/configuration.module';
import { Unit } from '../units/entities/unit';
import { Subcontractor } from '../subcontractors/entities/subcontractor.entity';
import { EquipmentCategoryGroup } from '../equipments/entities/equipment-category-group.entity';
import { Project } from '../projects/entities/project.entity';
import { DailycheckGroup } from './entities/dailycheck-group.entity';
import { DailycheckGroupsService } from './dailycheck-groups.service';
import { BuildingRoom } from '../buildings/entities/building-room.entity';
import { BuildingLevel } from '../buildings/entities/building-level.entity';
import { Building } from '../buildings/entities/building.entity';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forFeature([
      Equipment,
      Unit,
      DailycheckProcedure,
      DailycheckOperation,
      DailycheckOperationLabel,
      DailycheckOperationParameter,
      DailycheckGroup,
      Subcontractor,
      EquipmentCategoryGroup,
      Project,
      BuildingRoom,
      BuildingLevel,
      Building,
    ]),
  ],
  controllers: [DailycheckProceduresController],
  providers: [
    DailycheckProceduresService,
    DailycheckOperationLabelsService,
    DailycheckOperationParametersService,
    DailycheckOperationsService,
    DailycheckGroupsService,
  ],
})
export class DailycheckProceduresModule {}
