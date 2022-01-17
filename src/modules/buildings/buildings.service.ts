import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { use } from 'passport';
import { checkForRole, checkForRoles } from '../../util/roles';
import { DeepPartial, In, Repository } from 'typeorm';
import {
  ProviderOrgRoles,
  TenantOrgRoles,
  UserRole,
} from '../authentication/enums/user-roles.enum';
import { AppConfig } from '../configuration/configuration.service';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { OrganizationTypes } from '../organizations/enums/organization-types.enum';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { BuildingLevel } from './entities/building-level.entity';
import { BuildingRoom } from './entities/building-room.entity';
import { Building } from './entities/building.entity';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(BuildingRoom)
    private buildingRoomsRepository: Repository<BuildingRoom>,
    @InjectRepository(BuildingLevel)
    private buildingLevelsRepository: Repository<BuildingLevel>,
    @InjectRepository(Building)
    private buildingsRepository: Repository<Building>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private config: AppConfig,
  ) {}

  async createWithNestedValues(createBuildingDto: CreateBuildingDto) {
    const levelsDB = [];
    if (createBuildingDto.levels && createBuildingDto.levels.length > 0) {
      for (const level of createBuildingDto.levels) {
        const levelDB = this.buildingRoomsRepository.create(level);
        await this.buildingLevelsRepository.save(levelDB);
        levelsDB.push(levelDB);

        let roomsDB = [];
        if (level.rooms && level.rooms.length > 0) {
          const roomsToCreate = [];
          for (const room of level.rooms) {
            roomsToCreate.push(
              this.buildingRoomsRepository.create({ ...room, level: levelDB }),
            );
          }
          roomsDB = await this.buildingRoomsRepository.save(roomsToCreate);
        }
      }
    }

    const buildingData: DeepPartial<Building> = {
      ...createBuildingDto,
      levels: levelsDB,
    };

    const building = this.buildingsRepository.create(buildingData);
    await this.buildingsRepository.save(building);

    return true;
  }

  async create(createBuildingDto: CreateBuildingDto) {
    const levelsDB = [];

    const buildingData: DeepPartial<Building> = {
      ...createBuildingDto,
      levels: levelsDB,
    };

    if (createBuildingDto.projectId) {
      const project = await this.projectsRepository.findOne(
        createBuildingDto.projectId,
      );
      if (!project) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);
      buildingData.project = project;
    }

    const building = this.buildingsRepository.create(buildingData);
    return await this.buildingsRepository.save(building);
  }

  async getAllBuildingsInProjectFullInfo(projectId: number, userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    if (user.organization.type == OrganizationTypes.tenant) {
      throw new ForbiddenException();
    }

    const buildings = await this.buildingsRepository.find({
      where: { project: { id: projectId } },
      relations: ['levels', 'levels.rooms', 'levels.buildings'],
      order: {
        id: 'ASC',
      },
    });

    for (const building of buildings) {
      building.levels = building.levels.sort((a, b) => {
        if (a.positionIndex == 0 && b.positionIndex == 0) return a.id - b.id;
        return a.positionIndex - b.positionIndex;
      });
      for (const level of building.levels) {
        level.rooms = level.rooms.sort((a, b) => {
          if (a.positionIndex == 0 && b.positionIndex == 0) return a.id - b.id;
          return a.positionIndex - b.positionIndex;
        });
      }
    }

    return {
      total: buildings.length,
      data: buildings,
    };
  }

  async getUserForLocationInfo(
    userId: number,
    forUserId: number,
  ): Promise<User> {
    let user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: [
        'roles',
        'organization',
        'organization.locations',
        'organization.locations.buildingRooms',
      ],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    if (checkForRoles(ProviderOrgRoles, user.roles)) {
      if (forUserId)
        user = await this.usersRepository.findOne({
          where: { id: forUserId },
          relations: [
            'roles',
            'organization',
            'organization.locations',
            'organization.locations.buildingRooms',
          ],
        });
      if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);
    }

    return user;
  }

  async getAllBuildingsInProject(
    projectId: number,
    userId: number,
    forUserId: number,
  ) {
    const user = await this.getUserForLocationInfo(userId, forUserId);

    let whereObject: any = { project: { id: projectId } };
    if (user.organization.type == OrganizationTypes.tenant) {
      const buildingIds = user.organization.locations.map((location) => {
        if (location.projectId == projectId) return location.buildingId;
      });
      whereObject = { id: In(buildingIds) };
    }

    const buildings = await this.buildingsRepository.find({
      where: whereObject,
      order: {
        positionIndex: 'ASC',
        id: 'ASC',
      },
    });

    return {
      total: buildings.length,
      data: buildings,
    };
  }

  async getAllLevelsInBuilding(
    buildingId: number,
    userId: number,
    forUserId: number,
  ) {
    const user = await this.getUserForLocationInfo(userId, forUserId);

    let data: BuildingLevel[];
    if (user.organization.type == OrganizationTypes.tenant) {
      const levelIds = user.organization.locations.map((location) => {
        if (location.buildingId == buildingId) return location.buildingLevelId;
      });
      data = await this.buildingLevelsRepository.find({
        where: { id: In(levelIds) },
      });
    } else {
      const res = await this.buildingsRepository.findOne({
        where: { id: buildingId },
        relations: ['levels'],
      });
      if (!res) throw new BadRequestException(ErrorTypes.BUILDING_NOT_FOUND);
      data = res.levels;
    }
    return {
      total: data.length,
      data: data,
    };
  }

  async getAllRoomsOnLevel(levelId: number, userId: number, forUserId: number) {
    const user = await this.getUserForLocationInfo(userId, forUserId);

    let data: BuildingRoom[];
    if (user.organization.type == OrganizationTypes.tenant) {
      for (const location of user.organization.locations) {
        if (location.buildingLevelId == levelId) {
          if (location.buildingRooms.length > 0) {
            data = location.buildingRooms;
          } else {
            const res = await this.buildingLevelsRepository.findOne({
              where: { id: levelId },
              relations: ['rooms'],
            });
            if (!res)
              throw new BadRequestException(
                ErrorTypes.BUILDING_LEVEL_NOT_FOUND,
              );
            data = res.rooms;
          }
        }
      }
    } else {
      const res = await this.buildingLevelsRepository.findOne({
        where: { id: levelId },
        relations: ['rooms'],
      });
      if (!res)
        throw new BadRequestException(ErrorTypes.BUILDING_LEVEL_NOT_FOUND);
      data = res.rooms;
    }

    return {
      total: data.length,
      data: data,
    };
  }

  async findOne(id: number) {
    const data = await this.buildingsRepository.findOne({
      where: { id },
      relations: ['levels', 'levels.rooms'],
    });
    return data;
  }

  async update(id: number, updateBuildingDto: UpdateBuildingDto) {
    const buildingData: DeepPartial<BuildingRoom> = {
      ...updateBuildingDto,
    };
    buildingData['id'] = id;

    const buildingDB = await this.buildingsRepository.preload(buildingData);
    return await this.buildingsRepository.save(buildingDB);
  }

  async remove(id: number) {
    try {
      await this.buildingsRepository.delete({ id: id });
    } catch (e) {
      if (e.code == 23503) {
        throw new BadRequestException(
          ErrorTypes.UNABLE_TO_DELETE_BUILDING_FK_CONSTRAINT,
        );
      }
      throw new BadRequestException(ErrorTypes.UNABLE_TO_DELETE_BUILDING);
    }
    return true;
  }
}
