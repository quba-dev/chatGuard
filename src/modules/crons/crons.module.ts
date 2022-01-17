import { Module } from '@nestjs/common';
import { CronsService } from './crons.service';
import { CronsController } from './crons.controller';
import { TicketsModule } from '../tickets/tickets.module';
import { WeatherModule } from '../weather/weather.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PmpDcEventsModule } from '../pmp-dc-events/pmp-dc-events.module';
import { ProcurementsModule } from '../procurements/procurements.module';

@Module({
  imports: [
    TicketsModule,
    ProcurementsModule,
    WeatherModule,
    NotificationsModule,
    PmpDcEventsModule,
  ],
  controllers: [CronsController],
  providers: [CronsService],
})
export class CronsModule {}
