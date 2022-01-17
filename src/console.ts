import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RolesService } from './modules/authentication/roles.service';
import { GeoLocationService } from './modules/geoLocation/geo-location.service';
import { OrganizationsService } from './modules/organizations/organizations.service';
import { StandardProceduresService } from './modules/standard-procedures/standard-procedures.service';
import { SubcontractorCategoriesService } from './modules/subcontractors/subcontractor-categories.service';
import { UnitsService } from './modules/units/units.service';
import { UsersService } from './modules/users/users.service';
import { ScaffoldService } from './modules/scaffold/scaffold.service';

async function bootstrap() {
  const subcontractorCategoriesDefaults = ['heating', 'cooling'];

  const application = await NestFactory.createApplicationContext(AppModule);

  const command = process.argv[2];

  switch (command) {
    case 'init':
      const usersService = application.get(UsersService);
      const rolesService = application.get(RolesService);
      const geolocationService = application.get(GeoLocationService);
      const subcontractorCategoriesService = application.get(
        SubcontractorCategoriesService,
      );
      const standardProceduresService = application.get(
        StandardProceduresService,
      );
      const unitsService = application.get(UnitsService);
      const organizationsService = application.get(OrganizationsService);

      await rolesService.createRoles();
      await usersService.createInitialUsers();
      await geolocationService.importCountries();
      await geolocationService.importCities();
      await subcontractorCategoriesService.populateSubcontractorCategories(
        subcontractorCategoriesDefaults,
      );
      await organizationsService.populateDefaultProviderOrg();
      await organizationsService.populateDefaultCountriesForProviderOrg();
      await unitsService.populateUnits();
      await standardProceduresService.populateStdProcedures();

      //scaffold
      const scaffoldService = application.get(ScaffoldService);
      await scaffoldService.createTestProject();
      break;
    default:
      console.log('Command not found');
      process.exit(1);
  }

  await application.close();
  process.exit(0);
}

bootstrap();
