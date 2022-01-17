import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './modules/configuration';
import { DatabaseModule } from './modules/database/database.module';
import { TypeOrmDefaultConfigService } from './modules/database/database.providers';
import { UsersModule } from './modules/users/users.module';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { GeoLocationModule } from './modules/geoLocation/geo-location.module';
import { SubcontractorsModule } from './modules/subcontractors/subcontractors.module';
import { BuildingsModule } from './modules/buildings/buildings.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { FilesModule } from './modules/files/files.module';
import { StandardProceduresModule } from './modules/standard-procedures/standard-procedures.module';
import { UnitsModule } from './modules/units/units.module';
import { EquipmentsModule } from './modules/equipments/equipments.module';
import { MaintenanceProceduresModule } from './modules/maintenance-procedures/maintenance-procedures.module';
import { DailycheckProceduresModule } from './modules/dailycheck-procedures/dailycheck-procedures.module';
import { PmpEventsModule } from './modules/pmp-events/pmp-events.module';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './modules/health/health.controller';
import { ChatModule } from './modules/chat/chat.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { ProcurementsModule } from './modules/procurements/procurements.module';
import { ScaffoldModule } from './modules/scaffold/scaffold.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { CronsModule } from './modules/crons/crons.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PersonalAgendaModule } from './modules/personal-agenda/personal-agenda.module';
import { PmpDcEventsModule } from './modules/pmp-dc-events/pmp-dc-events.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WeatherModule } from './modules/weather/weather.module';
import { EmailsModule } from './modules/emails/emails.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [DatabaseModule],
      useExisting: TypeOrmDefaultConfigService,
    }),
    // globals
    ConfigModule.forRoot({
      ignoreEnvFile: false,
      ignoreEnvVars: false,
      isGlobal: true,
      expandVariables: true,
      load: [configuration],
    }),
    NotificationsModule,
    EmailsModule,
    // others
    UsersModule,
    AuthenticationModule,
    OrganizationsModule,
    GeoLocationModule,
    SubcontractorsModule,
    BuildingsModule,
    ProjectsModule,
    FilesModule,
    StandardProceduresModule,
    UnitsModule,
    EquipmentsModule,
    MaintenanceProceduresModule,
    DailycheckProceduresModule,
    PmpEventsModule,
    TerminusModule,
    ChatModule,
    TicketsModule,
    ProcurementsModule,
    ScaffoldModule,
    WorkOrdersModule,
    CronsModule,
    PersonalAgendaModule,
    PmpDcEventsModule,
    NotificationsModule,
    WeatherModule,
    WebsocketModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
