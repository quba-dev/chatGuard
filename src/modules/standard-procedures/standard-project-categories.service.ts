import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { lstatSync, readdirSync, readFileSync } from 'fs';
import { md5Hash } from '../../util/util';
import { In, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { Organization } from '../organizations/entities/organization.entity';
import { OrganizationTypes } from '../organizations/enums/organization-types.enum';
import { User } from '../users/entities/user.entity';
import { StandardEquipmentCategory } from './entities/standard-equipment-category';
import { StandardEquipmentCategoryGroup } from './entities/standard-equipment-category-group';
import { StandardEquipmentProjectCategory } from './entities/standard-equipment-project-category';
import { StandardOperation } from './entities/standard-operation';
import { StandardOperationLabel } from './entities/standard-operation-label';
import { StandardOperationParameter } from './entities/standard-operation-parameter';
import { StandardProcedure } from './entities/standard-procedure';
import { Unit } from '../units/entities/unit';
import { CreateProjectCategoryDto } from './dto/create-project-category.dto';
import { UpdateProjectCategoryDto } from './dto/update-project-category.dto';
import { ErrorTypes } from '../error/enums/errorTypes.enum';

@Injectable()
export class StandardProjectCategoriesService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(StandardEquipmentProjectCategory)
    private standardEquipmentProjectCategoriesRepository: Repository<StandardEquipmentProjectCategory>,
    @InjectRepository(StandardEquipmentCategoryGroup)
    private standardEquipmentCategoryGroupsRepository: Repository<StandardEquipmentCategoryGroup>,
    @InjectRepository(StandardEquipmentCategory)
    private standardEquipmentCategoriesRepository: Repository<StandardEquipmentCategory>,
    @InjectRepository(StandardProcedure)
    private standardProceduresRepository: Repository<StandardProcedure>,
    @InjectRepository(StandardOperation)
    private standardOperationsRepository: Repository<StandardOperation>,
    @InjectRepository(StandardOperationLabel)
    private standardOperationLabelsRepository: Repository<StandardOperationLabel>,
    @InjectRepository(StandardOperationParameter)
    private standardOperationParametersRepository: Repository<StandardOperationParameter>,
    @InjectRepository(Unit)
    private unitsRepository: Repository<Unit>,
    private config: AppConfig,
  ) {}

  async createStandardProjectCategory(
    createStandardProjectCategoryDto: CreateProjectCategoryDto,
    userId: number,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    let standardProjectCategory =
      await this.standardEquipmentProjectCategoriesRepository.findOne({
        where: { name: createStandardProjectCategoryDto.name },
      });
    if (standardProjectCategory)
      throw new BadRequestException(
        ErrorTypes.STANDARD_PROJECT_CATEGORY_EXISTS,
      );

    standardProjectCategory = new StandardEquipmentProjectCategory();

    standardProjectCategory.name = createStandardProjectCategoryDto.name;
    standardProjectCategory.organization = user.organization;

    await this.standardEquipmentProjectCategoriesRepository.save(
      standardProjectCategory,
    );

    return standardProjectCategory;
  }

  async updateStandardProjectCategory(
    updateStandardProjectCategoryDto: UpdateProjectCategoryDto,
    id: number,
  ) {
    const standardProjectCategory =
      await this.standardEquipmentProjectCategoriesRepository.findOne({
        where: { id },
      });
    if (!standardProjectCategory) return true;

    standardProjectCategory.name = updateStandardProjectCategoryDto.name;

    await this.standardEquipmentProjectCategoriesRepository.save(
      standardProjectCategory,
    );
    return true;
  }

  async removeStandardProjectCategory(id: number) {
    const standardProjectCategory =
      await this.standardEquipmentProjectCategoriesRepository.findOne(id);
    if (!standardProjectCategory) return true;

    await this.standardEquipmentProjectCategoriesRepository.remove(
      standardProjectCategory,
    );
    return true;
  }
}
