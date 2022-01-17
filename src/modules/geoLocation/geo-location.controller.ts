import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { GeoLocationService } from './geo-location.service';

@Controller('api/geolocation')
@ApiTags('api/geolocation')
export class GeoLocationController {
  constructor(private readonly geoLocationService: GeoLocationService) {}

  @Get('/countries')
  @UseGuards(JwtAuthGuard)
  getCountries(@Request() req: any) {
    const tokenData = req.user;

    return this.geoLocationService.getCountries(tokenData.id);
  }

  @Get('/states/by-country-id/:countryId')
  @UseGuards(JwtAuthGuard)
  getStates(@Param('countryId') countryId: number) {
    return this.geoLocationService.getStatesByCountryId(countryId);
  }

  @Get('/cities/by-country-id/:countryId/by-state/:stateIsoCode')
  @UseGuards(JwtAuthGuard)
  getCities(
    @Param('countryId') countryId: number,
    @Param('stateIsoCode') stateIsoCode: string,
  ) {
    return this.geoLocationService.getCitiesByCountryIdAndState(
      countryId,
      stateIsoCode,
    );
  }
}
