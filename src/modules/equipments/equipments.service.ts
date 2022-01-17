import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { checkForRole, checkIfUserHasAccessToProject } from '../../util/roles';
import { DeepPartial, ILike, Repository } from 'typeorm';
import { UserRole } from '../authentication/enums/user-roles.enum';
import { BuildingLevel } from '../buildings/entities/building-level.entity';
import { BuildingRoom } from '../buildings/entities/building-room.entity';
import { Building } from '../buildings/entities/building.entity';
import { AppConfig } from '../configuration/configuration.service';
import { MaintenanceOperation } from '../maintenance-procedures/entities/maintenance-operation';
import { MaintenanceOperationLabel } from '../maintenance-procedures/entities/maintenance-operation-label';
import { MaintenanceOperationParameter } from '../maintenance-procedures/entities/maintenance-operation-parameter';
import { MaintenanceProcedure } from '../maintenance-procedures/entities/maintenance-procedure';
import { OperationTypes } from '../maintenance-procedures/enums/operation-types.enum';
import { Organization } from '../organizations/entities/organization.entity';
import { Project } from '../projects/entities/project.entity';
import { StandardEquipmentCategoryGroup } from '../standard-procedures/entities/standard-equipment-category-group';
import { StandardOperation } from '../standard-procedures/entities/standard-operation';
import { StandardOperationLabel } from '../standard-procedures/entities/standard-operation-label';
import { StandardOperationParameter } from '../standard-procedures/entities/standard-operation-parameter';
import { StandardProcedure } from '../standard-procedures/entities/standard-procedure';
import { User } from '../users/entities/user.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { Equipment } from './entities/equipment.entity';
import { EquipmentCategoryGroup } from './entities/equipment-category-group.entity';
import { EquipmentInput } from './entities/equipment-input.entity';
import { EquipmentModel } from './entities/equipment-model.entity';
import { EquipmentProjectCategory } from './entities/equipment-project-category.entity';
import { Manufacturer } from './entities/manufacturer.entity';
import * as dayjs from 'dayjs';
import { PmpEventsService } from '../pmp-events/pmp-events.service';
import { File } from '../files/entities/file.entity';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { sanitizeWithRelations } from '../../util/util';
import { buildPaginationObject } from '../../util/pagination';

@Injectable()
export class EquipmentsService {
  constructor(
    @InjectRepository(Equipment)
    private equipmentsRepository: Repository<Equipment>,
    @InjectRepository(EquipmentProjectCategory)
    private equipmentProjectCategoriesRepository: Repository<EquipmentProjectCategory>,
    @InjectRepository(EquipmentCategoryGroup)
    private equipmentCategoryGroupsRepository: Repository<EquipmentCategoryGroup>,
    @InjectRepository(EquipmentModel)
    private equipmentModelsRepository: Repository<EquipmentModel>,
    @InjectRepository(Manufacturer)
    private manufacturersRepository: Repository<Manufacturer>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Building)
    private buildingsRepository: Repository<Building>,
    @InjectRepository(BuildingLevel)
    private buildingLevelsRepository: Repository<BuildingLevel>,
    @InjectRepository(BuildingRoom)
    private buildingRoomsRepository: Repository<BuildingRoom>,
    @InjectRepository(EquipmentInput)
    private equipmentInputsRepository: Repository<EquipmentInput>,
    @InjectRepository(StandardEquipmentCategoryGroup)
    private standardEquipmentCategoryGroupsRepository: Repository<StandardEquipmentCategoryGroup>,
    @InjectRepository(StandardProcedure)
    private standardProceduresRepository: Repository<StandardProcedure>,
    @InjectRepository(StandardOperation)
    private standardOperationsRepository: Repository<StandardOperation>,
    @InjectRepository(StandardOperationLabel)
    private standardOperationLabelsRepository: Repository<StandardOperationLabel>,
    @InjectRepository(StandardOperationParameter)
    private standardOperationParametersRepository: Repository<StandardOperationParameter>,
    @InjectRepository(MaintenanceProcedure)
    private maintenanceProceduresRepository: Repository<MaintenanceProcedure>,
    @InjectRepository(MaintenanceOperation)
    private maintenanceOperationsRepository: Repository<MaintenanceOperation>,
    @InjectRepository(MaintenanceOperationLabel)
    private maintenanceOperationLabelsRepository: Repository<MaintenanceOperationLabel>,
    @InjectRepository(MaintenanceOperationParameter)
    private maintenanceOperationParametersRepository: Repository<MaintenanceOperationParameter>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    private readonly pmpEventService: PmpEventsService,
    private config: AppConfig,
  ) {}

  async create(createEquipmentDto: CreateEquipmentDto) {
    const equipmentData: DeepPartial<Equipment> = {
      ...createEquipmentDto,
    };

    const equipmentModel = await this.equipmentModelsRepository.findOne(
      createEquipmentDto.equipmentModelId,
    );
    if (!equipmentModel)
      throw new BadRequestException(ErrorTypes.EQUIPMENT_MODEL_NOT_FOUND);
    equipmentData.equipmentModel = equipmentModel;

    const manufacturer = await this.manufacturersRepository.findOne(
      createEquipmentDto.manufacturerId,
    );
    if (!manufacturer)
      throw new BadRequestException(
        ErrorTypes.EQUIPMENT_MANUFACTURER_NOT_FOUND,
      );
    equipmentData.manufacturer = manufacturer;

    const project = await this.projectsRepository.findOne(
      createEquipmentDto.projectId,
    );
    if (!project) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);
    equipmentData.project = project;

    const standardCategoryGroup =
      await this.standardEquipmentCategoryGroupsRepository.findOne({
        where: { id: createEquipmentDto.standardCategoryGroupId },
        relations: ['category'],
      });
    if (!standardCategoryGroup)
      throw new BadRequestException(
        ErrorTypes.STANDARD_CATEGORY_GROUP_NOT_FOUND,
      );
    equipmentData.standardCategoryGroup = standardCategoryGroup;
    equipmentData.standardCategory = standardCategoryGroup.category;

    const equipmentCategoryGroup =
      await this.equipmentCategoryGroupsRepository.findOne({
        where: { id: createEquipmentDto.equipmentCategoryGroupId },
        relations: ['equipmentProjectCategory'],
      });
    if (!equipmentCategoryGroup)
      throw new BadRequestException(ErrorTypes.EQUIPMENT_CATEGORY_NOT_FOUND);
    equipmentData.categoryGroup = equipmentCategoryGroup;
    equipmentData.projectCategory =
      equipmentCategoryGroup.equipmentProjectCategory;

    if (createEquipmentDto.buildingId) {
      const building = await this.buildingsRepository.findOne(
        createEquipmentDto.buildingId,
      );
      if (!building)
        throw new BadRequestException(ErrorTypes.BUILDING_NOT_FOUND);
      equipmentData.building = building;
    }

    if (createEquipmentDto.buildingLevelId) {
      const buildingLevel = await this.buildingLevelsRepository.findOne(
        createEquipmentDto.buildingLevelId,
      );
      if (!buildingLevel)
        throw new BadRequestException(ErrorTypes.BUILDING_LEVEL_NOT_FOUND);
      equipmentData.buildingLevel = buildingLevel;
    }

    if (createEquipmentDto.buildingRoomId) {
      const buildingRoom = await this.buildingRoomsRepository.findOne(
        createEquipmentDto.buildingRoomId,
      );
      if (!buildingRoom)
        throw new BadRequestException(ErrorTypes.BUILDING_ROOM_NOT_FOUND);
      equipmentData.buildingRoom = buildingRoom;
    }

    let inputsDB = [];
    if (createEquipmentDto.inputs && createEquipmentDto.inputs.length > 0) {
      const inputsToCreate = [];
      for (const input of createEquipmentDto.inputs) {
        inputsToCreate.push(
          this.equipmentInputsRepository.create({
            ...input,
            unit: { id: input.unitId },
          }),
        );
      }
      inputsDB = await this.equipmentInputsRepository.save(inputsToCreate);
    }
    equipmentData.equipmentInputs = inputsDB;

    if (createEquipmentDto.mediaFileIds) {
      const files = [];
      for (const fileId of createEquipmentDto.mediaFileIds) {
        try {
          const file = await this.filesRepository.findOne(fileId);
          if (file) {
            files.push(file);
          }
        } catch (e) {}
      }
      equipmentData.mediaFiles = files;
    }

    if (createEquipmentDto.documentationFileIds) {
      const files = [];
      for (const fileId of createEquipmentDto.documentationFileIds) {
        try {
          const file = await this.filesRepository.findOne(fileId);
          if (file) {
            files.push(file);
          }
        } catch (e) {}
      }
      equipmentData.documentationFiles = files;
    }

    const equipment = await this.equipmentsRepository.save(equipmentData);
    const start = dayjs(project.startDate);
    const end = start.add(2, 'years');
    const standardProcedures = await this.standardProceduresRepository.find({
      where: {
        categoryGroup: { id: createEquipmentDto.standardCategoryGroupId },
      },
    });
    for (const standardProcedure of standardProcedures) {
      const maintenanceProcedure = this.maintenanceProceduresRepository.create({
        ...standardProcedure,
        equipment,
        id: null,
        isFromStandard: true,
      });
      await this.maintenanceProceduresRepository.save(maintenanceProcedure);

      await this.pmpEventService.createEventsForMaintenanceProcedure(
        start,
        end,
        maintenanceProcedure,
        project,
      );

      const standardOperations = await this.standardOperationsRepository.find({
        where: { procedure: standardProcedure },
      });
      for (const standardOperation of standardOperations) {
        const maintenanceOperation =
          this.maintenanceOperationsRepository.create({
            ...standardOperation,
            procedure: maintenanceProcedure,
            id: null,
          });
        await this.maintenanceOperationsRepository.save(maintenanceOperation);

        if (maintenanceOperation.type === OperationTypes.visual) {
          const standardOperationLabels =
            await this.standardOperationLabelsRepository.find({
              where: { operation: standardOperation },
            });
          for (const standardOperationLabel of standardOperationLabels) {
            const maintenanceOperationLabel =
              this.maintenanceOperationLabelsRepository.create({
                ...standardOperationLabel,
                operation: maintenanceOperation,
                id: null,
              });
            this.maintenanceOperationLabelsRepository.save(
              maintenanceOperationLabel,
            );
          }
        }

        if (maintenanceOperation.type === OperationTypes.parameter) {
          const standardOperationParameters =
            await this.standardOperationParametersRepository.find({
              where: { operation: standardOperation },
              relations: ['unit'],
            });
          for (const standardOperationParameter of standardOperationParameters) {
            const maintenanceOperationParameter =
              this.maintenanceOperationParametersRepository.create({
                ...standardOperationParameter,
                operation: maintenanceOperation,
                id: null,
              });
            this.maintenanceOperationParametersRepository.save(
              maintenanceOperationParameter,
            );
          }
        }
      }
    }

    //update project global updated at
    project.globalUpdatedAt = new Date();
    this.projectsRepository.save(project);

    return equipment;
  }

  async findAllInProject(projectId: number) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: [
        'equipments',
        'equipments.projectCategory',
        'equipments.categoryGroup',
        'equipments.equipmentModel',
        'equipments.manufacturer',
        'equipments.building',
        'equipments.buildingLevel',
        'equipments.buildingRoom',
        'equipments.equipmentInputs',
        'equipments.equipmentInputs.unit',
        // 'equipments.maintenanceProcedures',
        // 'equipments.maintenanceProcedures.operations',
        // 'equipments.maintenanceProcedures.operations.labels',
        // 'equipments.maintenanceProcedures.operations.parameters',
        // 'equipments.maintenanceProcedures.operations.parameters.unit',
        // 'equipments.maintenanceProcedures.subcontractor',
        'equipments.linkedEquipments',
      ],
    });
    return {
      total: project.equipments.length,
      data: project.equipments,
    };
  }

  async findAllByCategoryGroup(categoryGroupId: number) {
    const equipments = await this.equipmentsRepository.find({
      where: { categoryGroup: { id: categoryGroupId } },
      relations: [
        'projectCategory',
        'categoryGroup',
        'equipmentModel',
        'manufacturer',
        'building',
        'buildingLevel',
        'buildingRoom',
        'equipmentInputs',
        'equipmentInputs.unit',
        'maintenanceProcedures',
        'maintenanceProcedures.operations',
        'maintenanceProcedures.operations.labels',
        'maintenanceProcedures.operations.parameters',
        'maintenanceProcedures.operations.parameters.unit',
        'maintenanceProcedures.subcontractor',
        'linkedEquipments',
      ],
    });
    return {
      total: equipments.length,
      data: equipments,
    };
  }

  async getProjectEquipmentTree(projectId: number) {
    const equipmentTree = await this.equipmentProjectCategoriesRepository.find({
      where: { project: { id: projectId } },
      relations: [
        'equipmentCategoryGroups',
        'equipmentCategoryGroups.equipments',
        'equipmentCategoryGroups.equipments.maintenanceProcedures',
      ],
    });

    for (const equipmentProjectCategory of equipmentTree) {
      for (const equipmentCategoryGroup of equipmentProjectCategory.equipmentCategoryGroups) {
        for (const equipment of equipmentCategoryGroup.equipments) {
          equipment.maintenanceProceduresCount =
            equipment.maintenanceProcedures.length;
          delete equipment.maintenanceProcedures;
        }
      }
    }
    return equipmentTree;
  }

  async getProjectCategoryGroupsByProjectCategoriesNoCounts(projectId: number) {
    const equipmentTree = await this.equipmentProjectCategoriesRepository.find({
      where: { project: { id: projectId } },
      relations: ['equipmentCategoryGroups'],
    });

    const equipmentTreeObj = equipmentTree.map((item) => {
      const result: any = item.toJSON();
      result.equipmentCategoryGroups = result.equipmentCategoryGroups.map(
        (item) => {
          return item.toJSON();
        },
      );
      return result;
    });

    return {
      equipmentProjectCategories: equipmentTreeObj,
    };
  }

  async getProjectCategoryGroupsByProjectCategories(projectId: number) {
    const equipmentTree = await this.equipmentProjectCategoriesRepository.find({
      where: { project: { id: projectId } },
      relations: [
        'equipmentCategoryGroups',
        'equipmentCategoryGroups.equipments',
      ],
    });

    const equipmentTreeObj = equipmentTree.map((item) => {
      const result: any = item.toJSON();
      result.equipmentCategoryGroups = result.equipmentCategoryGroups.map(
        (item) => {
          return item.toJSON();
        },
      );
      return result;
    });

    let totalEq = 0;
    for (let i = 0; i < equipmentTreeObj.length; i++) {
      let total = 0;
      for (
        let j = 0;
        j < equipmentTreeObj[i].equipmentCategoryGroups.length;
        j++
      ) {
        equipmentTreeObj[i].equipmentCategoryGroups[j]['count'] =
          equipmentTreeObj[i].equipmentCategoryGroups[j].equipments.length;
        total += equipmentTreeObj[i].equipmentCategoryGroups[j]['count'];

        delete equipmentTreeObj[i].equipmentCategoryGroups[j].equipments;
      }
      equipmentTreeObj[i]['count'] = total;
      totalEq += total;
    }

    return {
      count: totalEq,
      equipmentProjectCategories: equipmentTreeObj,
    };
  }

  async findOne(id: number, withRelations: string) {
    const extraRelations = sanitizeWithRelations(
      [
        'maintenanceProcedures',
        'maintenanceProcedures.operations',
        'maintenanceProcedures.operations.labels',
        'maintenanceProcedures.operations.parameters',
        'maintenanceProcedures.operations.parameters.unit',
        'maintenanceProcedures.subcontractor',
      ],
      withRelations,
    );
    const equipment = await this.equipmentsRepository.findOne({
      where: { id },
      relations: [
        'projectCategory',
        'categoryGroup',
        'standardCategoryGroup',
        'standardCategory',
        'equipmentModel',
        'manufacturer',
        'project',
        'building',
        'buildingLevel',
        'buildingRoom',
        'equipmentInputs',
        'equipmentInputs.unit',
        'mediaFiles',
        'documentationFiles',
        'linkedEquipments',
        ...extraRelations,
      ],
    });

    return equipment;
  }

  async update(id: number, updateEquipmentDto: UpdateEquipmentDto, userId) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization', 'projects'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const equipmentToUpdate = await this.equipmentsRepository.findOne({
      where: { id },
      relations: ['project', 'projectCategory'],
    });
    if (!equipmentToUpdate)
      throw new BadRequestException(ErrorTypes.EQUIPMENT_NOT_FOUND);

    if (equipmentToUpdate.isReadonly)
      throw new BadRequestException(ErrorTypes.EQUIPMENT_IS_READ_ONLY);

    let organizationProjects = null;
    if (checkForRole(UserRole.admin, user.roles)) {
      const userOrganization = await this.organizationsRepository.findOne({
        where: { id: user.organization.id },
        relations: ['projects'],
      });
      organizationProjects = userOrganization.projects;
    }

    const userCanUpdateProject = checkIfUserHasAccessToProject(
      user,
      equipmentToUpdate.project.id,
      organizationProjects,
    );
    if (!userCanUpdateProject) throw new ForbiddenException();

    const equipmentData: DeepPartial<Equipment> = {
      ...updateEquipmentDto,
    };

    if (updateEquipmentDto.equipmentModelId) {
      const equipmentModel = await this.equipmentModelsRepository.findOne(
        updateEquipmentDto.equipmentModelId,
      );
      if (!equipmentModel)
        throw new BadRequestException(ErrorTypes.EQUIPMENT_MODEL_NOT_FOUND);
      equipmentData.equipmentModel = equipmentModel;
    }

    if (updateEquipmentDto.manufacturerId) {
      const manufacturer = await this.manufacturersRepository.findOne(
        updateEquipmentDto.manufacturerId,
      );
      if (!manufacturer)
        throw new BadRequestException(
          ErrorTypes.EQUIPMENT_MANUFACTURER_NOT_FOUND,
        );
      equipmentData.manufacturer = manufacturer;
    }

    if (updateEquipmentDto.buildingId) {
      const building = await this.buildingsRepository.findOne(
        updateEquipmentDto.buildingId,
      );
      if (!building)
        throw new BadRequestException(ErrorTypes.BUILDING_NOT_FOUND);
      equipmentData.building = building;
    }

    if (updateEquipmentDto.buildingLevelId) {
      const buildingLevel = await this.buildingLevelsRepository.findOne(
        updateEquipmentDto.buildingLevelId,
      );
      if (!buildingLevel)
        throw new BadRequestException(ErrorTypes.BUILDING_LEVEL_NOT_FOUND);
      equipmentData.buildingLevel = buildingLevel;
    }

    if (updateEquipmentDto.buildingRoomId) {
      const buildingRoom = await this.buildingRoomsRepository.findOne(
        updateEquipmentDto.buildingRoomId,
      );
      if (!buildingRoom)
        throw new BadRequestException(ErrorTypes.BUILDING_ROOM_NOT_FOUND);
      equipmentData.buildingRoom = buildingRoom;
    }

    if (updateEquipmentDto.inputs) {
      let inputsDB = [];
      const inputsToCreate = [];
      await this.equipmentInputsRepository.delete({ equipment: { id } });
      for (const input of updateEquipmentDto.inputs) {
        inputsToCreate.push(
          this.equipmentInputsRepository.create({
            ...input,
            unit: { id: input.unitId },
          }),
        );
      }
      inputsDB = await this.equipmentInputsRepository.save(inputsToCreate);
      equipmentData.equipmentInputs = inputsDB;
    }

    if (updateEquipmentDto.mediaFileIds) {
      const files = [];
      for (const fileId of updateEquipmentDto.mediaFileIds) {
        try {
          const file = await this.filesRepository.findOne(fileId);
          if (file) {
            files.push(file);
          }
        } catch (e) {}
      }
      equipmentData.mediaFiles = files;
    }

    if (updateEquipmentDto.documentationFileIds) {
      const files = [];
      for (const fileId of updateEquipmentDto.documentationFileIds) {
        try {
          const file = await this.filesRepository.findOne(fileId);
          if (file) {
            files.push(file);
          }
        } catch (e) {}
      }
      equipmentData.documentationFiles = files;
    }

    if (updateEquipmentDto.equipmentCategoryGroupId) {
      const equipmentCategoryGroup =
        await this.equipmentCategoryGroupsRepository.findOne(
          updateEquipmentDto.equipmentCategoryGroupId,
        );
      if (!equipmentCategoryGroup)
        throw new BadRequestException(ErrorTypes.EQUIPMENT_CATEGORY_NOT_FOUND);
      equipmentData.categoryGroup = equipmentCategoryGroup;
    }

    equipmentData['id'] = id;

    const equipment = await this.equipmentsRepository.preload(equipmentData);
    await this.equipmentsRepository.save(equipment);

    //update project global updated at
    equipmentToUpdate.project.globalUpdatedAt = new Date();
    this.projectsRepository.save(equipmentToUpdate.project);

    return true;
  }

  async remove(id: number) {
    const equipment = await this.equipmentsRepository.findOne(id);
    if (!equipment)
      throw new BadRequestException(ErrorTypes.EQUIPMENT_NOT_FOUND);

    if (!equipment.isDeletable)
      throw new BadRequestException(
        ErrorTypes.UNABLE_TO_DELETE_EQUIPMENT_NOT_DELETABLE,
      );

    if (equipment.isReadonly)
      throw new BadRequestException(
        ErrorTypes.UNABLE_TO_DELETE_EQUIPMENT_READ_ONLY,
      );

    try {
      await this.equipmentsRepository.delete({ id: id });
    } catch (e) {
      if (e.code == 23503) {
        throw new BadRequestException(
          ErrorTypes.UNABLE_TO_DELETE_EQUIPMENT_FK_CONSTRAINT,
        );
      }
    }
    return true;
  }

  async makeReadonly(id: number) {
    const equipment = await this.equipmentsRepository.findOne({
      where: { id },
      relations: ['maintenanceProcedures', 'project'],
    });
    if (!equipment)
      throw new BadRequestException(ErrorTypes.EQUIPMENT_NOT_FOUND);

    if (equipment.isReadonly) return true;

    equipment.isReadonly = true;
    await this.equipmentsRepository.save(equipment);

    for (const maintenanceProcedure of equipment.maintenanceProcedures) {
      await this.pmpEventService.removeEventsForMaintenanceProcedure(
        maintenanceProcedure,
        equipment.project,
        dayjs(equipment.project.startDate),
      );
    }

    return true;
  }

  async linkEquipmentToEquipment(
    sourceEquipmentId: number,
    destinationEquipmentId: number,
  ) {
    const equipmentSource = await this.equipmentsRepository.findOne({
      where: { id: sourceEquipmentId },
      relations: ['linkedEquipments'],
    });
    if (!equipmentSource)
      throw new BadRequestException(ErrorTypes.SOURCE_EQUIPMENT_NOT_FOUND);

    const equipmentDestination = await this.equipmentsRepository.findOne({
      where: { id: destinationEquipmentId },
      relations: ['linkedEquipments'],
    });
    if (!equipmentDestination)
      throw new BadRequestException(ErrorTypes.BUILDING_LEVEL_NOT_FOUND);

    const equipmentIndexSource = equipmentSource.linkedEquipments.findIndex(
      (equipment) => equipment.id === destinationEquipmentId,
    );
    if (equipmentIndexSource === -1) {
      equipmentSource.linkedEquipments.push(equipmentDestination);
      await this.equipmentsRepository.save(equipmentSource);
    }

    const equipmentIndexDesttination =
      equipmentDestination.linkedEquipments.findIndex(
        (equipment) => equipment.id === sourceEquipmentId,
      );
    if (equipmentIndexDesttination === -1) {
      equipmentDestination.linkedEquipments.push(equipmentSource);
      await this.equipmentsRepository.save(equipmentDestination);
    }
    return true;
  }

  async unlinkEquipmentFromEquipment(
    sourceEquipmentId: number,
    destinationEquipmentId: number,
  ) {
    const equipmentSource = await this.equipmentsRepository.findOne({
      where: { id: sourceEquipmentId },
      relations: ['linkedEquipments'],
    });
    if (!equipmentSource)
      throw new BadRequestException(ErrorTypes.SOURCE_EQUIPMENT_NOT_FOUND);

    const equipmentDestination = await this.equipmentsRepository.findOne({
      where: { id: destinationEquipmentId },
      relations: ['linkedEquipments'],
    });
    if (!equipmentDestination)
      throw new BadRequestException(ErrorTypes.BUILDING_LEVEL_NOT_FOUND);

    const equipmentIndexSource = equipmentSource.linkedEquipments.findIndex(
      (equipment) => equipment.id === destinationEquipmentId,
    );
    if (equipmentIndexSource !== -1) {
      equipmentSource.linkedEquipments.splice(equipmentIndexSource, 1);
      await this.equipmentsRepository.save(equipmentSource);
    }

    const equipmentIndexDestination =
      equipmentDestination.linkedEquipments.findIndex(
        (equipment) => equipment.id === sourceEquipmentId,
      );
    if (equipmentIndexDestination !== -1) {
      equipmentDestination.linkedEquipments.splice(
        equipmentIndexDestination,
        1,
      );
      await this.equipmentsRepository.save(equipmentDestination);
    }
    return true;
  }

  async search(
    namePart: string,
    projectId: number,
    userId: number,
    page = 0,
    limit = 0,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization', 'projects'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    let organizationProjects = null;
    if (checkForRole(UserRole.admin, user.roles)) {
      const userOrganization = await this.organizationsRepository.findOne({
        where: { id: user.organization.id },
        relations: ['projects'],
      });
      organizationProjects = userOrganization.projects;
    }

    const userHasAccess = checkIfUserHasAccessToProject(
      user,
      projectId,
      organizationProjects,
    );
    if (!userHasAccess) {
      throw new ForbiddenException();
    }

    const paginationObject = buildPaginationObject(page, limit);

    const count = await this.equipmentsRepository.count({
      where: {
        name: ILike(`%${namePart}%`),
        project: { id: projectId },
      },
    });

    const data = await this.equipmentsRepository.find({
      where: {
        name: ILike(`%${namePart}%`),
        project: { id: projectId },
      },
      ...paginationObject,
    });
    return {
      total: count,
      data,
    };
  }
}
