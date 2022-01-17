import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { EquipmentCategoryGroup } from '../equipments/entities/equipment-category-group.entity';
import { Equipment } from '../equipments/entities/equipment.entity';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { Project } from '../projects/entities/project.entity';
import { Subcontractor } from '../subcontractors/entities/subcontractor.entity';
import { CreateDailycheckProcedureDto } from './dto/create-dailycheck-procedure.dto';
import { UpdateDailycheckProcedureDto } from './dto/update-dailycheck-procedure.dto';
import { DailycheckGroup } from './entities/dailycheck-group.entity';
import { DailycheckOperation } from './entities/dailycheck-operation.entity';
import { DailycheckProcedure } from './entities/dailycheck-procedure.entity';

@Injectable()
export class DailycheckProceduresService {
  constructor(
    @InjectRepository(DailycheckProcedure)
    private dailycheckProceduresRepository: Repository<DailycheckProcedure>,
    @InjectRepository(DailycheckOperation)
    private dailycheckOperationsRepository: Repository<DailycheckOperation>,
    @InjectRepository(Equipment)
    private equipmentsRepository: Repository<Equipment>,
    @InjectRepository(EquipmentCategoryGroup)
    private equipmentCategoryGroupsRepository: Repository<EquipmentCategoryGroup>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(DailycheckGroup)
    private dailycheckGroupsRepository: Repository<DailycheckGroup>,
    private config: AppConfig,
  ) {}

  async create(createDailycheckProcedureDto: CreateDailycheckProcedureDto) {
    const dailycheckProcedureData: DeepPartial<DailycheckProcedure> = {
      ...createDailycheckProcedureDto,
    };

    if (
      createDailycheckProcedureDto.equipmentId &&
      createDailycheckProcedureDto.equipmentCategoryGroupId
    ) {
      throw new BadRequestException(
        ErrorTypes.YOU_NEED_TO_SET_EITHER_EQUIPMENT_OR_EQUIPMENT_CATEGORY_GROUP_FOR_DAILYCHECK_PROCEDURE,
      );
    }

    if (createDailycheckProcedureDto.equipmentId) {
      const equipment = await this.equipmentsRepository.findOne({
        where: { id: createDailycheckProcedureDto.equipmentId },
      });
      if (!equipment)
        throw new BadRequestException(ErrorTypes.EQUIPMENT_NOT_FOUND);

      dailycheckProcedureData.equipment = equipment;
    }

    if (createDailycheckProcedureDto.equipmentCategoryGroupId) {
      const equipmentCategoryGroup =
        await this.equipmentCategoryGroupsRepository.findOne({
          where: { id: createDailycheckProcedureDto.equipmentCategoryGroupId },
        });
      if (!equipmentCategoryGroup)
        throw new BadRequestException(
          ErrorTypes.EQUIPMENT_CATEGORY_GROUP_NOT_FOUND,
        );

      dailycheckProcedureData.equipmentCategoryGroup = equipmentCategoryGroup;
    }

    if (!createDailycheckProcedureDto.projectId)
      throw new BadRequestException(ErrorTypes.PROJECT_ID_NOT_SET);

    const project = await this.projectsRepository.findOne({
      where: { id: createDailycheckProcedureDto.projectId },
    });
    if (!project) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);

    dailycheckProcedureData.project = project;

    if (createDailycheckProcedureDto.groupId) {
      const dailycheckGroup = await this.dailycheckGroupsRepository.findOne({
        where: {
          id: createDailycheckProcedureDto.groupId,
          project: { id: project.id },
        },
      });
      if (!dailycheckGroup)
        throw new BadRequestException(ErrorTypes.DAILYCHECK_GROUP_NOT_FOUND);

      dailycheckProcedureData.group = dailycheckGroup;
    }

    const dailycheckProcedure = this.dailycheckProceduresRepository.create(
      dailycheckProcedureData,
    );
    return await this.dailycheckProceduresRepository.save(dailycheckProcedure);
  }

  async update(
    id: number,
    updateDailycheckProcedureDto: UpdateDailycheckProcedureDto,
  ) {
    const dailycheckProcedureData: DeepPartial<DailycheckProcedure> = {
      ...updateDailycheckProcedureDto,
    };

    if (
      updateDailycheckProcedureDto.equipmentId &&
      updateDailycheckProcedureDto.equipmentCategoryGroupId
    ) {
      throw new BadRequestException(
        ErrorTypes.YOU_NEED_TO_SET_EITHER_EQUIPMENT_OR_EQUIPMENT_CATEGORY_GROUP_FOR_DAILYCHECK_PROCEDURE,
      );
    }

    if (updateDailycheckProcedureDto.equipmentId) {
      const equipment = await this.equipmentsRepository.findOne(
        updateDailycheckProcedureDto.equipmentId,
      );
      if (!equipment)
        throw new BadRequestException(ErrorTypes.EQUIPMENT_NOT_FOUND);
      dailycheckProcedureData.equipment = equipment;
      dailycheckProcedureData.equipmentCategoryGroup = null;
    } else if (`${updateDailycheckProcedureDto.equipmentId}` == '') {
      dailycheckProcedureData.equipment = null;
    }

    if (updateDailycheckProcedureDto.equipmentCategoryGroupId) {
      const equipmentCategoryGroup =
        await this.equipmentCategoryGroupsRepository.findOne({
          where: { id: updateDailycheckProcedureDto.equipmentCategoryGroupId },
        });
      if (!equipmentCategoryGroup)
        throw new BadRequestException(
          ErrorTypes.EQUIPMENT_CATEGORY_GROUP_NOT_FOUND,
        );

      dailycheckProcedureData.equipmentCategoryGroup = equipmentCategoryGroup;
      dailycheckProcedureData.equipment = null;
    } else if (
      `${updateDailycheckProcedureDto.equipmentCategoryGroupId}` == ''
    ) {
      dailycheckProcedureData.equipmentCategoryGroup = null;
    }

    if (updateDailycheckProcedureDto.groupId) {
      const dailycheckGroup = await this.dailycheckGroupsRepository.findOne({
        where: {
          id: updateDailycheckProcedureDto.groupId,
        },
      });
      if (!dailycheckGroup)
        throw new BadRequestException(ErrorTypes.DAILYCHECK_GROUP_NOT_FOUND);

      dailycheckProcedureData.group = dailycheckGroup;
    }

    dailycheckProcedureData['id'] = id;

    const dailycheckProcedureDB =
      await this.dailycheckProceduresRepository.preload(
        dailycheckProcedureData,
      );
    return await this.dailycheckProceduresRepository.save(
      dailycheckProcedureDB,
    );
  }

  async getAllDailychecksInProject(projectId: number) {
    const dailycheckProcedures = await this.dailycheckProceduresRepository.find(
      {
        where: { project: { id: projectId } },
        relations: [
          'operations',
          'equipment',
          'equipmentCategoryGroup',
          'operations.labels',
          'operations.parameters',
          'operations.parameters.unit',
        ],
      },
    );

    return {
      total: dailycheckProcedures.length,
      data: dailycheckProcedures,
    };
  }

  async remove(id: number) {
    return await this.dailycheckProceduresRepository.delete({ id: id });
  }
}
