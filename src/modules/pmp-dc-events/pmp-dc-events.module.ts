import { Module } from '@nestjs/common';
import { PmpDcEventsService } from './pmp-dc-events.service';
import { PmpDcEventsController } from './pmp-dc-events.controller';
import { AppConfigModule } from '../configuration/configuration.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailycheckProcedure } from '../dailycheck-procedures/entities/dailycheck-procedure.entity';
import { PmpDCEvent } from './entities/pmp-dc-event.entity';
import { PmpDCEventMeasurement } from './entities/pmp-dc-event-measurement.entity';
import { PmpDCEventOperationData } from './entities/pmp-dc-event-operation-data.entity';
import { PmpDCEventLogItem } from './entities/pmp-dc-event-log-item.entity';
import { Project } from '../projects/entities/project.entity';
import { DailycheckOperation } from '../dailycheck-procedures/entities/dailycheck-operation.entity';
import { DailycheckOperationParameter } from '../dailycheck-procedures/entities/dailycheck-operation-parameter.entity';
import { DailycheckOperationLabel } from '../dailycheck-procedures/entities/dailycheck-operation-label.entity';
import { Equipment } from '../equipments/entities/equipment.entity';
import { File } from '../files/entities/file.entity';
import { PmpDcsService } from './pmp-dc.service';
import { PmpDC } from './entities/pmp-dc.entity';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forFeature([
      DailycheckProcedure,
      PmpDCEvent,
      PmpDCEventMeasurement,
      PmpDCEventOperationData,
      PmpDCEventLogItem,
      Project,
      DailycheckOperation,
      DailycheckOperationParameter,
      DailycheckOperationLabel,
      File,
      PmpDCEventLogItem,
      Equipment,
      PmpDC,
    ]),
  ],
  controllers: [PmpDcEventsController],
  providers: [PmpDcEventsService, PmpDcsService],
  exports: [PmpDcsService],
})
export class PmpDcEventsModule {}
