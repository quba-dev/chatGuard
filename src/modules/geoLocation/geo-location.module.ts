import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';
import { GeoLocationController } from './geo-location.controller';
import { GeoLocationService } from './geo-location.service';

@Module({
  imports: [TypeOrmModule.forFeature([Country, City, User])],
  providers: [GeoLocationService],
  controllers: [GeoLocationController],
  exports: [GeoLocationService],
})
export class GeoLocationModule {}
