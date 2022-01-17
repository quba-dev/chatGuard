import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { EquipmentProjectCategory } from './entities/equipment-project-category.entity';

@Injectable()
export class EquipmentProjectCategoriesService {
  constructor(
    @InjectRepository(EquipmentProjectCategory)
    private equipmentProjectCategoriesRepository: Repository<EquipmentProjectCategory>,
    private config: AppConfig,
  ) {}

  async findAll(projectId: number) {
    const data = await this.equipmentProjectCategoriesRepository.find({
      where: { project: { id: projectId } },
    });
    return {
      total: data.length,
      data,
    };
  }
}
