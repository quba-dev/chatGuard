import { Module } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { HttpModule } from '@nestjs/axios';
import { AppConfigModule } from '../configuration/configuration.module';
import { City } from '../geoLocation/entities/city.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeatherCurrent } from './entities/weather-current.entity';
import { WeatherHourly } from './entities/weather-hourly.entity';
import { WeatherDaily } from './entities/weather-daily.entity';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [
    AppConfigModule,
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
    TypeOrmModule.forFeature([
      City,
      WeatherCurrent,
      WeatherHourly,
      WeatherDaily,
      Project,
    ]),
  ],
  controllers: [WeatherController],
  providers: [WeatherService],
  exports: [WeatherService],
})
export class WeatherModule {}
