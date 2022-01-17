import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppConfig } from '../configuration/configuration.service';
import { TicketsService } from '../tickets/tickets.service';
import { WeatherService } from '../weather/weather.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PmpDcsService } from '../pmp-dc-events/pmp-dc.service';
import { ProcurementsService } from '../procurements/procurements.service';

@Injectable()
export class CronsService {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly procurementsService: ProcurementsService,
    private readonly weatherService: WeatherService,
    private readonly notificationsService: NotificationsService,
    private readonly pmpDcsService: PmpDcsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async autoCloseTickets() {
    console.info('**CRON** running autoCloseTickets');
    await this.ticketsService.closeStaleTickets();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async autoCloseProcurements() {
    console.info('**CRON** running autoCloseProcurements');
    await this.procurementsService.closeStaleProposals();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async autoUpdateWeather() {
    console.info('**CRON** updated city weather for active projects.');
    await this.weatherService.updateWeatherForActiveCities();
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async sendEmailNotifications() {
    await this.notificationsService.sendEmailNotifications();
  }

  // @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async createDailyCheckForActiveProjects() {
    await this.pmpDcsService.createDailyCheckForActiveProjects();
  }
}
