import { Module } from '@nestjs/common';
import { SubcontractorsService } from './subcontractors.service';
import { SubcontractorsController } from './subcontractors.controller';
import { Subcontractor } from './entities/subcontractor.entity';
import { SubcontractorContact } from './entities/subcontractor-contact.entity';
import { SubcontractorCategory } from './entities/subcontractor-category.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../configuration/configuration.module';
import { SubcontractorCategoriesService } from './subcontractor-categories.service';
import { City } from '../geoLocation/entities/city.entity';
import { Country } from '../geoLocation/entities/country.entity';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forFeature([
      Organization,
      Subcontractor,
      SubcontractorContact,
      SubcontractorCategory,
      City,
      Country,
      User,
      Project,
    ]),
  ],
  controllers: [SubcontractorsController],
  providers: [SubcontractorsService, SubcontractorCategoriesService],
})
export class SubcontractorsModule {}
