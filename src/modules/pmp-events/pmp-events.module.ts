import { Module } from '@nestjs/common';
import { PmpEventsService } from './pmp-events.service';
import { PmpEventsController } from './pmp-events.controller';
import { PmpEvent } from './entities/pmp-event.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../configuration/configuration.module';
import { Project } from '../projects/entities/project.entity';
import { PmpEventMeasurement } from './entities/pmp-event-measurement.entity';
import { MaintenanceOperationLabel } from '../maintenance-procedures/entities/maintenance-operation-label';
import { MaintenanceOperationParameter } from '../maintenance-procedures/entities/maintenance-operation-parameter';
import { MaintenanceOperation } from '../maintenance-procedures/entities/maintenance-operation';
import { Subcontractor } from '../subcontractors/entities/subcontractor.entity';
import { File } from '../files/entities/file.entity';
import { PmpEventLogItem } from './entities/pmp-event-log-item.entity';
import { Equipment } from '../equipments/entities/equipment.entity';
import { PmpEventOperationData } from './entities/pmp-event-operation-data.entity';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forFeature([
      PmpEvent,
      Project,
      PmpEventMeasurement,
      PmpEventOperationData,
      MaintenanceOperation,
      MaintenanceOperationParameter,
      MaintenanceOperationLabel,
      Subcontractor,
      File,
      PmpEventLogItem,
      Equipment,
    ]),
  ],
  controllers: [PmpEventsController],
  providers: [PmpEventsService],
  exports: [PmpEventsService],
})
export class PmpEventsModule {}
