import { Module } from '@nestjs/common';
import { MaintenanceProceduresService } from './maintenance-procedures.service';
import { MaintenanceProceduresController } from './maintenance-procedures.controller';
import { MaintenanceOperationLabel } from './entities/maintenance-operation-label';
import { MaintenanceOperationLabelsService } from './maintenance-operation-label.service';
import { MaintenanceProcedure } from './entities/maintenance-procedure';
import { MaintenanceOperationParameter } from './entities/maintenance-operation-parameter';
import { MaintenanceOperationParametersService } from './maintenance-operation-parameter.service';
import { MaintenanceOperation } from './entities/maintenance-operation';
import { MaintenanceOperationsService } from './maintenance-operation.service';
import { Equipment } from '../equipments/entities/equipment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../configuration/configuration.module';
import { Unit } from '../units/entities/unit';
import { Subcontractor } from '../subcontractors/entities/subcontractor.entity';
import { PmpEvent } from '../pmp-events/entities/pmp-event.entity';
import { PmpEventsModule } from '../pmp-events/pmp-events.module';

@Module({
  imports: [
    AppConfigModule,
    PmpEventsModule,
    TypeOrmModule.forFeature([
      Equipment,
      Unit,
      MaintenanceProcedure,
      MaintenanceOperation,
      MaintenanceOperationLabel,
      MaintenanceOperationParameter,
      Subcontractor,
      PmpEvent,
    ]),
  ],
  controllers: [MaintenanceProceduresController],
  providers: [
    MaintenanceProceduresService,
    MaintenanceOperationLabelsService,
    MaintenanceOperationParametersService,
    MaintenanceOperationsService,
  ],
  exports: [MaintenanceProceduresService],
})
export class MaintenanceProceduresModule {}
