import { Module } from '@nestjs/common';
import { StandardProceduresService } from './standard-procedures.service';
import { StandardProceduresController } from './standard-procedures.controller';
import { AppConfigModule } from '../configuration/configuration.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { StandardEquipmentProjectCategory } from './entities/standard-equipment-project-category';
import { StandardEquipmentCategoryGroup } from './entities/standard-equipment-category-group';
import { StandardEquipmentCategory } from './entities/standard-equipment-category';
import { StandardProcedure } from './entities/standard-procedure';
import { StandardOperation } from './entities/standard-operation';
import { StandardOperationLabel } from './entities/standard-operation-label';
import { StandardOperationParameter } from './entities/standard-operation-parameter';
import { Unit } from '../units/entities/unit';
import { StandardCategoriesService } from './standard-categories.service';
import { StandardCategoryGroupsService } from './standard-category-groups.service';
import { StandardOperationsService } from './standard-operations.service';
import { StandardLabelsService } from './standard-labels.service';
import { StandardParametersService } from './standard-parameters.service';
import { StandardProjectCategoriesService } from './standard-project-categories.service';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forFeature([
      Organization,
      User,
      StandardEquipmentProjectCategory,
      StandardEquipmentCategoryGroup,
      StandardEquipmentCategory,
      StandardProcedure,
      StandardOperation,
      StandardOperationLabel,
      StandardOperationParameter,
      Unit,
    ]),
  ],
  controllers: [StandardProceduresController],
  providers: [
    StandardCategoriesService,
    StandardCategoryGroupsService,
    StandardProceduresService,
    StandardOperationsService,
    StandardLabelsService,
    StandardParametersService,
    StandardProjectCategoriesService,
  ],
  exports: [
    StandardProceduresService,
    StandardCategoriesService,
    StandardCategoryGroupsService,
  ],
})
export class StandardProceduresModule {}
