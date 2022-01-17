import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { CreateBuildingLevelDto } from './dto/create-building-level.dto';
import { UpdateBuildingLevelDto } from './dto/update-building-level.dto';
import { BuildingLevel } from './entities/building-level.entity';
import { BuildingRoom } from './entities/building-room.entity';
import { Building } from './entities/building.entity';

@Injectable()
export class BuildingLevelsService {
  constructor(
    @InjectRepository(BuildingRoom)
    private buildingRoomsRepository: Repository<BuildingRoom>,
    @InjectRepository(BuildingLevel)
    private buildingLevelsRepository: Repository<BuildingLevel>,
    @InjectRepository(Building)
    private buildingsRepository: Repository<Building>,
    private config: AppConfig,
  ) {}

  async createWithNestedValues(createBuildingLevelDto: CreateBuildingLevelDto) {
    let roomsDB = [];
    if (
      createBuildingLevelDto.rooms &&
      createBuildingLevelDto.rooms.length > 0
    ) {
      const roomsToCreate = [];
      for (const room of createBuildingLevelDto.rooms) {
        roomsToCreate.push(this.buildingRoomsRepository.create(room));
      }
      roomsDB = await this.buildingRoomsRepository.save(roomsToCreate);
    }

    const levelData: DeepPartial<BuildingLevel> = {
      ...createBuildingLevelDto,
      rooms: roomsDB,
    };

    const level = this.buildingLevelsRepository.create(levelData);
    await this.buildingLevelsRepository.save(level);
    return true;
  }

  async create(createBuildingLevelDto: CreateBuildingLevelDto) {
    const roomsDB = [];

    const levelData: DeepPartial<BuildingLevel> = {
      ...createBuildingLevelDto,
      rooms: roomsDB,
    };

    if (createBuildingLevelDto.buildingId) {
      const building = await this.buildingsRepository.findOne(
        createBuildingLevelDto.buildingId,
      );
      if (!building) return {};

      levelData.buildings = [building];
    }

    const level = this.buildingLevelsRepository.create(levelData);
    return await this.buildingLevelsRepository.save(level);
  }

  async update(id: number, updateBuildingLevelDto: UpdateBuildingLevelDto) {
    const buildingLevelData: DeepPartial<BuildingRoom> = {
      ...updateBuildingLevelDto,
    };
    buildingLevelData['id'] = id;

    const buildingLevelDB = await this.buildingLevelsRepository.preload(
      buildingLevelData,
    );
    return await this.buildingLevelsRepository.save(buildingLevelDB);
  }

  async remove(id: number) {
    try {
      await this.buildingLevelsRepository.delete({ id: id });
    } catch (e) {
      if (e.code == 23503) {
        throw new BadRequestException(
          ErrorTypes.UNABLE_TO_DELETE_BUILDING_LEVEL_FK_CONSTRAINT,
        );
      }
      throw new BadRequestException(ErrorTypes.UNABLE_TO_DELETE_BUILDING_LEVEL);
    }
    return true;
  }

  async linkLevelToBuilding(buildingId: number, buildingLevelId: number) {
    const building = await this.buildingsRepository.findOne({
      where: { id: buildingId },
    });
    if (!building) throw new BadRequestException(ErrorTypes.BUILDING_NOT_FOUND);

    const level = await this.buildingLevelsRepository.findOne({
      where: { id: buildingLevelId },
      relations: ['buildings'],
    });
    if (!level)
      throw new BadRequestException(ErrorTypes.BUILDING_LEVEL_NOT_FOUND);

    const buildingIndex = level.buildings.findIndex(
      (building) => building.id === buildingId,
    );
    if (buildingIndex === -1) {
      level.buildings.push(building);
      await this.buildingLevelsRepository.save(level);
    }
    return true;
  }

  async unlinkLevelFromBuilding(buildingId: number, buildingLevelId: number) {
    const building = await this.buildingsRepository.findOne({
      where: { id: buildingId },
    });
    if (!building) throw new BadRequestException(ErrorTypes.BUILDING_NOT_FOUND);

    const level = await this.buildingLevelsRepository.findOne({
      where: { id: buildingLevelId },
      relations: ['buildings'],
    });
    if (!level)
      throw new BadRequestException(ErrorTypes.BUILDING_LEVEL_NOT_FOUND);

    const buildingIndex = level.buildings.findIndex(
      (building) => building.id === buildingId,
    );
    if (buildingIndex !== -1) {
      level.buildings.splice(buildingIndex, 1);
      await this.buildingLevelsRepository.save(level);
    }
    return true;
  }

  async updateLevelPositions(items: any[]) {
    for (const item of items) {
      await this.buildingLevelsRepository.update(item.id, {
        positionIndex: item.position,
      });
    }
    return true;
  }
}
