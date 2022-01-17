import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { Project } from '../projects/entities/project.entity';
import { EquipmentCategoryGroup } from './entities/equipment-category-group.entity';
import { EquipmentProjectCategory } from './entities/equipment-project-category.entity';

@Injectable()
export class EquipmentCategoryGroupsService {
  constructor(
    @InjectRepository(EquipmentCategoryGroup)
    private equipmentCategoryGroupsRepository: Repository<EquipmentCategoryGroup>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(EquipmentProjectCategory)
    private equipmentProjectCategoriesRepository: Repository<EquipmentProjectCategory>,
    private config: AppConfig,
  ) {}

  async findAll(projectId: number) {
    const data = await this.equipmentCategoryGroupsRepository.find({
      where: { project: { id: projectId } },
      relations: ['equipmentProjectCategory'],
    });
    return {
      total: data.length,
      data,
    };
  }

  async findAllByProjectCategoryId(projectCategoryId: number) {
    const data = await this.equipmentCategoryGroupsRepository.find({
      where: {
        equipmentProjectCategory: { id: projectCategoryId },
      },
    });
    return {
      total: data.length,
      data,
    };
  }

  async create(projectCategoryId: number, name: string) {
    const projectCategory =
      await this.equipmentProjectCategoriesRepository.findOne({
        where: { id: projectCategoryId },
        relations: ['project'],
      });
    if (!projectCategory)
      throw new BadRequestException(ErrorTypes.PROJECT_CATEGORY_NOT_FOUND);

    let equipmentCategoryGroup =
      await this.equipmentCategoryGroupsRepository.findOne({
        where: {
          project: projectCategory.project,
          equipmentProjectCategory: { id: projectCategoryId },
          name: name,
        },
      });
    if (equipmentCategoryGroup) return equipmentCategoryGroup;

    equipmentCategoryGroup = this.equipmentCategoryGroupsRepository.create({
      project: projectCategory.project,
      equipmentProjectCategory: { id: projectCategoryId },
      name: name,
    });

    await this.equipmentCategoryGroupsRepository.save(equipmentCategoryGroup);
    return equipmentCategoryGroup;
  }
}
