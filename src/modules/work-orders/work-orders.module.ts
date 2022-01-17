import { Module } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrdersController } from './work-orders.controller';
import { AppConfigModule } from '../configuration/configuration.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Equipment } from '../equipments/entities/equipment.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Procurement } from '../procurements/entities/procurement.entity';
import { WorkOrder } from './entities/work-order.entity';
import { Building } from '../buildings/entities/building.entity';
import { BuildingLevel } from '../buildings/entities/building-level.entity';
import { BuildingRoom } from '../buildings/entities/building-room.entity';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forFeature([
      User,
      Project,
      Equipment,
      Ticket,
      Procurement,
      WorkOrder,
      Building,
      BuildingLevel,
      BuildingRoom,
    ]),
  ],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
})
export class WorkOrdersModule {}
