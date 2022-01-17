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
import { CreateCategoryGroupDto } from './dto/create-category-group.dto';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { UpdateCategoryGroupDto } from './dto/update-category-group.dto';

@Injectable()
export class StandardCategoryGroupsService {
  constructor(
    @InjectRepository(StandardEquipmentCategoryGroup)
    private standardEquipmentCategoryGroupsRepository: Repository<StandardEquipmentCategoryGroup>,
    @InjectRepository(StandardEquipmentCategory)
    private standardEquipmentCategoriesRepository: Repository<StandardEquipmentCategory>,
    private config: AppConfig,
  ) {}

  async createStandardCategoryGroup(
    createStandardCategoryGroupDto: CreateCategoryGroupDto,
  ) {
    let standardCategoryGroup =
      await this.standardEquipmentCategoryGroupsRepository.findOne({
        where: { name: createStandardCategoryGroupDto.name },
      });
    if (standardCategoryGroup)
      throw new BadRequestException(ErrorTypes.STANDARD_CATEGORY_GROUP_EXISTS);

    const standardCategory =
      await this.standardEquipmentCategoriesRepository.findOne({
        where: { id: createStandardCategoryGroupDto.categoryId },
      });
    if (!standardCategory)
      throw new BadRequestException(ErrorTypes.STANDARD_CATEGORY_NOT_FOUND);

    standardCategoryGroup = new StandardEquipmentCategoryGroup();

    standardCategoryGroup.name = createStandardCategoryGroupDto.name;
    standardCategoryGroup.category = standardCategory;

    await this.standardEquipmentCategoryGroupsRepository.save(
      standardCategoryGroup,
    );

    return standardCategoryGroup;
  }

  async updateStandardCategoryGroup(
    updateStandardCategoryGroupDto: UpdateCategoryGroupDto,
    id: number,
  ) {
    const standardCategoryGroup =
      await this.standardEquipmentCategoryGroupsRepository.findOne({
        where: { id },
      });
    if (!standardCategoryGroup) return true;

    if (updateStandardCategoryGroupDto.categoryId) {
      const standardCategory =
        await this.standardEquipmentCategoriesRepository.findOne({
          where: { id: updateStandardCategoryGroupDto.categoryId },
        });
      if (!standardCategory)
        throw new BadRequestException(ErrorTypes.STANDARD_CATEGORY_NOT_FOUND);
      standardCategoryGroup.category = standardCategory;
    }

    standardCategoryGroup.name = updateStandardCategoryGroupDto.name;

    await this.standardEquipmentCategoryGroupsRepository.save(
      standardCategoryGroup,
    );
    return true;
  }

  async removeStandardCategoryGroup(id: number) {
    const standardCategoryGroup =
      await this.standardEquipmentCategoryGroupsRepository.findOne(id);
    if (!standardCategoryGroup) return true;

    await this.standardEquipmentCategoryGroupsRepository.remove(
      standardCategoryGroup,
    );
    return true;
  }

  async getStandardEquipmentCategoryGroupsByCategory(categoryId: number) {
    const data = await this.standardEquipmentCategoryGroupsRepository.find({
      where: { category: { id: categoryId } },
    });

    return {
      total: data.length,
      data,
    };
  }
}
