import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { buildPaginationObject } from '../../util/pagination';
import { ILike, Like, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { Manufacturer } from './entities/manufacturer.entity';
import { User } from '../users/entities/user.entity';
import { ErrorTypes } from '../error/enums/errorTypes.enum';

@Injectable()
export class ManufacturersService {
  constructor(
    @InjectRepository(Manufacturer)
    private manufacturersRepository: Repository<Manufacturer>,
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

    const manufacturer = new Manufacturer();
    manufacturer.name = name;
    manufacturer.organization = user.organization;

    return await this.manufacturersRepository.save(manufacturer);
  }

  async findAll(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const data = await this.manufacturersRepository.find({
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

    const count = await this.manufacturersRepository.count({
      where: {
        name: ILike(`%${namePart}%`),
        organization: { id: user.organization.id },
      },
    });

    const data = await this.manufacturersRepository.find({
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
