import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { Unit } from './entities/unit';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit)
    private unitsRepository: Repository<Unit>,
    private config: AppConfig,
  ) {}

  async populateUnits() {
    const content = readFileSync('src/modules/units/data/units.json', 'utf-8');
    const unitsObj = JSON.parse(content);
    for (const unit of unitsObj.units) {
      let unitDB = await this.unitsRepository.findOne({
        where: { name: unit.name },
      });
      if (!unitDB) {
        unitDB = new Unit();
        unitDB.name = unit.name;
        await this.unitsRepository.save(unitDB);
      }
    }
  }

  async findAll() {
    const data = await this.unitsRepository.find();
    return {
      total: data.length,
      data,
    };
  }
}
