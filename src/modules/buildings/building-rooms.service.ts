import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { CreateBuildingRoomDto } from './dto/create-building-room.dto';
import { UpdateBuildingRoomDto } from './dto/update-building-room.dto';
import { BuildingLevel } from './entities/building-level.entity';
import { BuildingRoom } from './entities/building-room.entity';

@Injectable()
export class BuildingRoomsService {
  constructor(
    @InjectRepository(BuildingRoom)
    private buildingRoomsRepository: Repository<BuildingRoom>,
    @InjectRepository(BuildingLevel)
    private buildingLevelsRepository: Repository<BuildingLevel>,
    private config: AppConfig,
  ) {}

  async create(createBuildingRoomDto: CreateBuildingRoomDto) {
    const roomData: DeepPartial<BuildingRoom> = {
      ...createBuildingRoomDto,
    };

    if (createBuildingRoomDto.levelId) {
      const level = await this.buildingLevelsRepository.findOne(
        createBuildingRoomDto.levelId,
      );
      if (!level) return {};

      roomData.level = level;
    }
    const room = this.buildingRoomsRepository.create(roomData);
    return await this.buildingRoomsRepository.save(room);
  }

  async update(id: number, updateBuildingRoomDto: UpdateBuildingRoomDto) {
    const buildingRoomData: DeepPartial<BuildingRoom> = {
      ...updateBuildingRoomDto,
    };
    buildingRoomData['id'] = id;
    const buildingRoomDB = await this.buildingRoomsRepository.preload(
      buildingRoomData,
    );
    return await this.buildingRoomsRepository.save(buildingRoomDB);
  }

  async remove(id: number) {
    try {
      await this.buildingRoomsRepository.delete({ id: id });
    } catch (e) {
      if (e.code == 23503) {
        throw new BadRequestException(
          ErrorTypes.UNABLE_TO_DELETE_BUILDING_ROOM_FK_CONSTRAINT,
        );
      }
      throw new BadRequestException(ErrorTypes.UNABLE_TO_DELETE_BUILDING_ROOM);
    }
    return true;
  }

  async updateRoomPositions(items: any[]) {
    if (!items) {
      return false;
    }

    for (const item of items) {
      await this.buildingRoomsRepository.update(item.id, {
        positionIndex: item.position,
      });
    }
    return true;
  }
}
