import { Controller, Get, Param } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { ApiTags } from '@nestjs/swagger';
@Controller('api/weather')
@ApiTags('api/weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  // @Get('/forceUpdate')
  // updateWeatherForActiveCities() {
  //   return this.weatherService.updateWeatherForActiveCities();
  // }

  @Get(':cityId')
  findOne(@Param('cityId') cityId: number) {
    return this.weatherService.findOne(cityId);
  }
}
