import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from './entities/organization.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../configuration/configuration.module';
import { User } from '../users/entities/user.entity';
import { Country } from '../geoLocation/entities/country.entity';
import { City } from '../geoLocation/entities/city.entity';
import { Role } from '../authentication/entities/role.entity';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forFeature([Organization, User, Country, City, Role]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
