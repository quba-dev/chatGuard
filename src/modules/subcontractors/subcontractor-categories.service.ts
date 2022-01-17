import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { SubcontractorCategory } from './entities/subcontractor-category.entity';

@Injectable()
export class SubcontractorCategoriesService {
  constructor(
    @InjectRepository(SubcontractorCategory)
    private subcontractorCategoriesRepository: Repository<SubcontractorCategory>,
    private config: AppConfig,
  ) {}

  async create(name: string) {
    const subcontractorCateory = new SubcontractorCategory();
    subcontractorCateory.name = name;
    await this.subcontractorCategoriesRepository.save(subcontractorCateory);

    return true;
  }

  async findAll() {
    const data = await this.subcontractorCategoriesRepository.find();
    return {
      total: data.length,
      data,
    };
  }

  async findOne(id: number) {
    const data = await this.subcontractorCategoriesRepository.findOne(id);
    return data;
  }

  async findOneByName(name: string) {
    const data = await this.subcontractorCategoriesRepository.findOne({
      where: { name },
    });
    return data;
  }

  async update(id: number, name: string) {
    return await this.subcontractorCategoriesRepository.save({ id, name });
  }

  async remove(id: number) {
    return await this.subcontractorCategoriesRepository.delete(id);
  }

  async populateSubcontractorCategories(categories: string[]) {
    for (const category of categories) {
      const categoryDb = await this.findOneByName(category);
      if (!categoryDb) {
        await this.create(category);
      }
    }
  }
}
