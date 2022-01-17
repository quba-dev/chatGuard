import { Global, Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { AppConfigModule } from '../configuration/configuration.module';
import { EmailsController } from './emails.controller';
import { MailgunModule } from '@nextnm/nestjs-mailgun';
import { AppConfig } from '../configuration/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../files/entities/file.entity';

@Global()
@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forFeature([File]),
    MailgunModule.forAsyncRoot({
      imports: [AppConfigModule],
      inject: [AppConfig],
      useFactory: async (config: AppConfig) => {
        return {
          DOMAIN: config.values.mailgun.domain,
          API_KEY: config.values.mailgun.apiKey,
          HOST: config.values.mailgun.apiHost,
        };
      },
    }),
  ],
  controllers: [EmailsController],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
