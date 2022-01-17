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
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ErrorTypes } from '../error/enums/errorTypes.enum';

@Injectable()
export class StandardCategoriesService {
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

  async createStandardCategory(
    createStandardCategoryDto: CreateCategoryDto,
    userId: number,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    let standardCategory =
      await this.standardEquipmentCategoriesRepository.findOne({
        where: { name: createStandardCategoryDto.name },
      });
    if (standardCategory)
      throw new BadRequestException(ErrorTypes.STANDARD_CATEGORY_EXISTS);

    standardCategory = new StandardEquipmentCategory();

    standardCategory.name = createStandardCategoryDto.name;
    standardCategory.organization = user.organization;

    await this.standardEquipmentCategoriesRepository.save(standardCategory);

    return standardCategory;
  }

  async updateStandardCategory(
    updateStandardCategoryDto: UpdateCategoryDto,
    id: number,
  ) {
    const standardCategory =
      await this.standardEquipmentCategoriesRepository.findOne({
        where: { id },
      });
    if (!standardCategory) return true;

    standardCategory.name = updateStandardCategoryDto.name;

    await this.standardEquipmentCategoriesRepository.save(standardCategory);
    return true;
  }

  async removeStandardCategory(id: number) {
    const standardCategory =
      await this.standardEquipmentCategoriesRepository.findOne(id);
    if (!standardCategory) return true;

    await this.standardEquipmentCategoriesRepository.remove(standardCategory);
    return true;
  }

  async getStandardEquipmentCategories(organizationId: number) {
    const data = await this.standardEquipmentCategoriesRepository.find({
      where: { organization: { id: organizationId } },
    });

    return {
      total: data.length,
      data,
    };
  }
}
