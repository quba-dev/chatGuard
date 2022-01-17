import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { buildPaginationObject } from '../../util/pagination';
import { ILike, Like, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { EquipmentModel } from './entities/equipment-model.entity';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EquipmentModelsService {
  constructor(
    @InjectRepository(EquipmentModel)
    private equipmentModelsRepository: Repository<EquipmentModel>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private config: AppConfig,
  ) {}

  async create(name: string, userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const equipmentModel = new EquipmentModel();
    equipmentModel.name = name;
    equipmentModel.organization = user.organization;

    return await this.equipmentModelsRepository.save(equipmentModel);
  }

  async findAll(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const data = await this.equipmentModelsRepository.find({
      where: { organization: { id: user.organization.id } },
    });
    return {
      total: data.length,
      data,
    };
  }

  async search(namePart: string, userId: number, page = 0, limit = 0) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const paginationObject = buildPaginationObject(page, limit);

    const count = await this.equipmentModelsRepository.count({
      where: {
        name: ILike(`%${namePart}%`),
        organization: { id: user.organization.id },
      },
    });

    const data = await this.equipmentModelsRepository.find({
      where: {
        name: ILike(`%${namePart}%`),
        organization: { id: user.organization.id },
      },
      ...paginationObject,
    });

    return {
      total: count,
      data,
    };
  }
}
