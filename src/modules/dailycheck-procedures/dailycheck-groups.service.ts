import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { Organization } from '../organizations/entities/organization.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateDailycheckGroupDto } from './dto/create-dailycheck-group.dto';
import { BuildingLevel } from '../buildings/entities/building-level.entity';
import { BuildingRoom } from '../buildings/entities/building-room.entity';
import { Building } from '../buildings/entities/building.entity';
import { DailycheckGroup } from './entities/dailycheck-group.entity';
import { UpdateDailycheckGroupDto } from './dto/update-dailycheck-group.dto';

@Injectable()
export class DailycheckGroupsService {
  constructor(
    @InjectRepository(BuildingRoom)
    private buildingRoomsRepository: Repository<BuildingRoom>,
    @InjectRepository(BuildingLevel)
    private buildingLevelsRepository: Repository<BuildingLevel>,
    @InjectRepository(Building)
    private buildingsRepository: Repository<Building>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(DailycheckGroup)
    private dailycheckGroupsRepository: Repository<DailycheckGroup>,
    private config: AppConfig,
  ) {}

  async createDailycheckGroup(dailycheckGroupDto: CreateDailycheckGroupDto) {
    const project = await this.projectsRepository.findOne(
      dailycheckGroupDto.projectId,
    );
    if (!project) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);

    let dailycheckGroup = await this.dailycheckGroupsRepository.findOne({
      where: { name: dailycheckGroupDto.name, project },
    });
    if (dailycheckGroup)
      throw new BadRequestException(ErrorTypes.DAILYCHECK_GROUP_EXISTS);

    dailycheckGroup = new DailycheckGroup();

    let building = null;
    if (dailycheckGroupDto.buildingId) {
      building = await this.buildingsRepository.findOne({
        where: { id: dailycheckGroupDto.buildingId },
        relations: ['project'],
      });
      if (!building)
        throw new BadRequestException(ErrorTypes.BUILDING_NOT_FOUND);
      if (building.project.id != project.id)
        throw new BadRequestException(
          ErrorTypes.BUILDING_IS_NOT_PART_OF_PROJECT,
        );
    }

    let level = null;
    if (dailycheckGroupDto.buildingLevelId) {
      level = await this.buildingLevelsRepository.findOne({
        where: { id: dailycheckGroupDto.buildingLevelId },
        relations: ['buildings'],
      });
      if (!level)
        throw new BadRequestException(ErrorTypes.BUILDING_LEVEL_NOT_FOUND);
      let levelIsPartOfBuilding = false;
      for (const buildingAux of level.buildings) {
        if (buildingAux.id === building.id) {
          levelIsPartOfBuilding = true;
          break;
        }
      }
      if (!levelIsPartOfBuilding)
        throw new BadRequestException(
          ErrorTypes.BUILDING_LEVEL_IS_NOT_PART_OF_BUILDING,
        );
    }

    let buildingRooms = [];
    if (dailycheckGroupDto.buildingRoomIds) {
      buildingRooms = await this.buildingRoomsRepository.find({
        where: { id: In(dailycheckGroupDto.buildingRoomIds) },
        relations: ['level'],
      });
      if (
        !buildingRooms ||
        buildingRooms.length != dailycheckGroupDto.buildingRoomIds.length
      )
        throw new BadRequestException(ErrorTypes.BUILDING_ROOM_NOT_FOUND);

      if (level == null)
        throw new BadRequestException(ErrorTypes.BUILDING_LEVEL_NOT_FOUND);

      for (const room of buildingRooms) {
        if (room.level.id != level.id)
          throw new BadRequestException(
            ErrorTypes.BUILDING_ROOM_IS_NOT_PART_OF_BUILDING,
          );
      }
    }

    dailycheckGroup.name = dailycheckGroupDto.name;
    dailycheckGroup.project = project;
    dailycheckGroup.building = building;
    dailycheckGroup.buildingLevel = level;
    dailycheckGroup.buildingRooms = buildingRooms;

    await this.dailycheckGroupsRepository.save(dailycheckGroup);

    return dailycheckGroup;
  }

  async updateDailycheckGroup(
    dailycheckGroupDto: UpdateDailycheckGroupDto,
    id: number,
  ) {
    const dailycheckGroup = await this.dailycheckGroupsRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!dailycheckGroup) return true;

    let building = null;
    if (dailycheckGroupDto.buildingId) {
      building = await this.buildingsRepository.findOne({
        where: { id: dailycheckGroupDto.buildingId },
        relations: ['project'],
      });
      if (!building)
        throw new BadRequestException(ErrorTypes.BUILDING_NOT_FOUND);
      if (building.project.id != dailycheckGroup.project.id)
        throw new BadRequestException(
          ErrorTypes.BUILDING_IS_NOT_PART_OF_PROJECT,
        );
      dailycheckGroup.building = building;
    }

    let level = null;
    if (dailycheckGroupDto.buildingLevelId) {
      level = await this.buildingLevelsRepository.findOne({
        where: { id: dailycheckGroupDto.buildingLevelId },
        relations: ['buildings'],
      });
      if (!level)
        throw new BadRequestException(ErrorTypes.BUILDING_LEVEL_NOT_FOUND);
      let levelIsPartOfBuilding = false;
      for (const buildingAux of level.buildings) {
        if (buildingAux.id === building.id) {
          levelIsPartOfBuilding = true;
          break;
        }
      }
      if (!levelIsPartOfBuilding)
        throw new BadRequestException(
          ErrorTypes.BUILDING_LEVEL_IS_NOT_PART_OF_BUILDING,
        );
      dailycheckGroup.buildingLevel = level;
    }

    if (dailycheckGroupDto.buildingRoomIds) {
      const buildingRooms = await this.buildingRoomsRepository.find({
        where: { id: In(dailycheckGroupDto.buildingRoomIds) },
        relations: ['level'],
      });
      if (
        !buildingRooms ||
        buildingRooms.length != dailycheckGroupDto.buildingRoomIds.length
      )
        throw new BadRequestException(ErrorTypes.BUILDING_ROOM_NOT_FOUND);

      for (const room of buildingRooms) {
        if (room.level.id != dailycheckGroup.buildingLevel.id)
          throw new BadRequestException(
            ErrorTypes.BUILDING_ROOM_IS_NOT_PART_OF_BUILDING,
          );
      }
      dailycheckGroup.buildingRooms = buildingRooms;
    }

    dailycheckGroup.name = dailycheckGroupDto.name;

    await this.dailycheckGroupsRepository.save(dailycheckGroup);
    return true;
  }

  async removeDailycheckGroup(id: number) {
    const dailycheckGroup = await this.dailycheckGroupsRepository.findOne(id);
    if (!dailycheckGroup) return true;

    await this.dailycheckGroupsRepository.remove(dailycheckGroup);
    return true;
  }

  async getAllDailycheckGroupsInProject(projectId: number) {
    const dailycheckProcedures = await this.dailycheckGroupsRepository.find({
      where: { project: { id: projectId } },
      relations: ['building', 'buildingLevel', 'buildingRooms'],
    });

    return {
      total: dailycheckProcedures.length,
      data: dailycheckProcedures,
    };
  }
}
