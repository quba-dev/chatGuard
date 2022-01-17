import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { Organization } from '../organizations/entities/organization.entity';
import { Project } from '../projects/entities/project.entity';
import { TenantLocationDto } from './dto/tenant-location.dto';
import { BuildingLevel } from './entities/building-level.entity';
import { BuildingRoom } from './entities/building-room.entity';
import { Building } from './entities/building.entity';
import { TenantLocation } from './entities/tenant-location.entity';

@Injectable()
export class TenantLocationsService {
  constructor(
    @InjectRepository(BuildingRoom)
    private buildingRoomsRepository: Repository<BuildingRoom>,
    @InjectRepository(BuildingLevel)
    private buildingLevelsRepository: Repository<BuildingLevel>,
    @InjectRepository(Building)
    private buildingsRepository: Repository<Building>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(TenantLocation)
    private tenantLocationsRepository: Repository<TenantLocation>,
    private config: AppConfig,
  ) {}

  async addTenantLocation(tenantLocationDto: TenantLocationDto) {
    const organization = await this.organizationsRepository.findOne(
      tenantLocationDto.organizationId,
    );
    if (!organization)
      throw new BadRequestException(ErrorTypes.ORGANIZATION_NOT_FOUND);

    const project = await this.projectsRepository.findOne(
      tenantLocationDto.projectId,
    );
    if (!project) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);

    const building = await this.buildingsRepository.findOne({
      where: { id: tenantLocationDto.buildingId },
      relations: ['project'],
    });
    if (!building) throw new BadRequestException(ErrorTypes.BUILDING_NOT_FOUND);
    if (building.project.id != project.id)
      throw new BadRequestException(ErrorTypes.BUILDING_IS_NOT_PART_OF_PROJECT);

    let level = null;
    if (tenantLocationDto.buildingLevelId) {
      level = await this.buildingLevelsRepository.findOne({
        where: { id: tenantLocationDto.buildingLevelId },
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

    let rooms = null;
    if (tenantLocationDto.buildingRoomIds) {
      rooms = await this.buildingRoomsRepository.find({
        where: { id: In(tenantLocationDto.buildingRoomIds) },
        relations: ['level'],
      });
      if (!rooms || rooms.length !== tenantLocationDto.buildingRoomIds.length)
        throw new BadRequestException(ErrorTypes.BUILDING_ROOM_NOT_FOUND);
      for (const room of rooms) {
        if (room.level.id != level.id)
          throw new BadRequestException(
            ErrorTypes.BUILDING_ROOM_IS_NOT_PART_OF_BUILDING,
          );
      }
    }

    let tenantLocation = await this.tenantLocationsRepository.findOne({
      where: {
        project: { id: tenantLocationDto.projectId },
        organization: { id: tenantLocationDto.organizationId },
        building: { id: tenantLocationDto.buildingId },
        buildingLevel: tenantLocationDto.buildingLevelId
          ? { id: tenantLocationDto.buildingLevelId }
          : IsNull(),
      },
    });
    if (tenantLocation) {
      tenantLocation.buildingRooms = rooms;
      await this.tenantLocationsRepository.save(tenantLocation);

      return true;
    }

    tenantLocation = new TenantLocation();
    tenantLocation.project = project;
    tenantLocation.organization = organization;
    tenantLocation.building = building;
    tenantLocation.buildingLevel = level;
    tenantLocation.buildingRooms = rooms;
    await this.tenantLocationsRepository.save(tenantLocation);

    //update project global updated at
    project.globalUpdatedAt = new Date();
    this.projectsRepository.save(project);

    return true;
  }

  async removeTenantLocation(tenantLocationDto: TenantLocationDto) {
    const tenantLocation = await this.tenantLocationsRepository.findOne({
      where: {
        project: { id: tenantLocationDto.projectId },
        organization: { id: tenantLocationDto.organizationId },
        building: { id: tenantLocationDto.buildingId },
        buildingLevel: tenantLocationDto.buildingLevelId
          ? { id: tenantLocationDto.buildingLevelId }
          : IsNull(),
      },
    });
    if (!tenantLocation) return true;

    await this.tenantLocationsRepository.remove(tenantLocation);

    //update project global updated at
    const project = await this.projectsRepository.findOne(
      tenantLocationDto.projectId,
    );
    if (project) {
      project.globalUpdatedAt = new Date();
      this.projectsRepository.save(project);
    }

    return true;
  }
}
