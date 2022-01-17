import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { DeepPartial, In, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { Equipment } from '../equipments/entities/equipment.entity';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { PmpEventsService } from '../pmp-events/pmp-events.service';
import { Project } from '../projects/entities/project.entity';
import { ProjectStatus } from '../projects/enums/project-status.enum';
import { Subcontractor } from '../subcontractors/entities/subcontractor.entity';
import { CreateMaintenanceProcedureDto } from './dto/create-maintenance-procedure.dto';
import { UpdateMaintenanceProcedureDto } from './dto/update-maintenance-procedure.dto';
import { MaintenanceOperation } from './entities/maintenance-operation';
import { MaintenanceOperationLabel } from './entities/maintenance-operation-label';
import { MaintenanceOperationParameter } from './entities/maintenance-operation-parameter';
import { MaintenanceProcedure } from './entities/maintenance-procedure';
import { OperationTypes } from './enums/operation-types.enum';
import { ProcedureSubtypes } from './enums/procedure-subtypes.enum';
import { MaintenanceOperationsService } from './maintenance-operation.service';

@Injectable()
export class MaintenanceProceduresService {
  constructor(
    @InjectRepository(MaintenanceProcedure)
    private maintenanceProceduresRepository: Repository<MaintenanceProcedure>,
    @InjectRepository(MaintenanceOperation)
    private maintenanceOperationsRepository: Repository<MaintenanceOperation>,
    @InjectRepository(MaintenanceOperationLabel)
    private maintenanceOperationLabelsRepository: Repository<MaintenanceOperationLabel>,
    @InjectRepository(MaintenanceOperationParameter)
    private maintenanceOperationParametersRepository: Repository<MaintenanceOperationParameter>,
    @InjectRepository(Equipment)
    private equipmentsRepository: Repository<Equipment>,
    @InjectRepository(Subcontractor)
    private subcontractorsRepository: Repository<Subcontractor>,
    private readonly pmpEventService: PmpEventsService,
    private config: AppConfig,
  ) {}

  async create(createMaintenanceProcedureDto: CreateMaintenanceProcedureDto) {
    const maintenanceProcedureData: DeepPartial<MaintenanceProcedure> = {
      ...createMaintenanceProcedureDto,
    };

    let project;
    if (createMaintenanceProcedureDto.equipmentId) {
      const equipment = await this.equipmentsRepository.findOne({
        where: { id: createMaintenanceProcedureDto.equipmentId },
        relations: ['project'],
      });
      if (!equipment)
        throw new BadRequestException(ErrorTypes.EQUIPMENT_NOT_FOUND);

      project = equipment.project;

      if (!project.startDate)
        throw new BadRequestException(ErrorTypes.PROJECT_NEEDS_START_DATE_SET);
      maintenanceProcedureData.equipment = equipment;
    }

    if (createMaintenanceProcedureDto.subcontractorId) {
      const subcontractor = await this.subcontractorsRepository.findOne(
        createMaintenanceProcedureDto.subcontractorId,
      );
      if (!subcontractor)
        throw new BadRequestException(ErrorTypes.SUBCONTRACTOR_NOT_FOUND);

      maintenanceProcedureData.subcontractor = subcontractor;
    }

    const maintenanceProcedure = this.maintenanceProceduresRepository.create(
      maintenanceProcedureData,
    );

    await this.maintenanceProceduresRepository.save(maintenanceProcedure);

    const start = dayjs(project.startDate);
    const end = start.add(2, 'years');

    await this.pmpEventService.createEventsForMaintenanceProcedure(
      start,
      end,
      maintenanceProcedure,
      project,
    );

    return maintenanceProcedure;
  }

  async update(
    id: number,
    updateMaintenanceProcedureDto: UpdateMaintenanceProcedureDto,
  ) {
    const oldMaintenanceProcedureDB =
      await this.maintenanceProceduresRepository.findOne({
        where: { id },
        relations: ['equipment', 'equipment.project'],
      });

    if (!oldMaintenanceProcedureDB)
      throw new BadRequestException(
        ErrorTypes.INVALID_MAINTENANCE_PROCEDURE_ID,
      );

    const project = oldMaintenanceProcedureDB.equipment.project;
    const maintenanceProcedureData: DeepPartial<MaintenanceProcedure> = {
      ...updateMaintenanceProcedureDto,
    };

    if (updateMaintenanceProcedureDto.equipmentId) {
      const equipment = await this.equipmentsRepository.findOne(
        updateMaintenanceProcedureDto.equipmentId,
      );
      if (!equipment)
        throw new BadRequestException(ErrorTypes.EQUIPMENT_NOT_FOUND);
      maintenanceProcedureData.equipment = equipment;
    }

    if (updateMaintenanceProcedureDto.subcontractorId) {
      const subcontractor = await this.subcontractorsRepository.findOne(
        updateMaintenanceProcedureDto.subcontractorId,
      );
      if (!subcontractor)
        throw new BadRequestException(ErrorTypes.SUBCONTRACTOR_NOT_FOUND);

      maintenanceProcedureData.subcontractor = subcontractor;
      if (maintenanceProcedureData.subType === ProcedureSubtypes.outsourced) {
        this.maintenanceOperationsRepository.delete({ procedure: { id } });
      }
    }
    maintenanceProcedureData['id'] = id;

    const maintenanceProcedureDB =
      await this.maintenanceProceduresRepository.preload(
        maintenanceProcedureData,
      );

    let result = maintenanceProcedureDB;
    const newStart = dayjs()
      .set('hour', 0)
      .set('minute', 0)
      .set('second', 0)
      .set('millisecond', 0);

    //check if there are any events with stored measurements in the db, if there are we need to clone
    //the  maintenance procedure and recreate all the events with no measurements
    const cloneCrtMaintenanceProcedure =
      await this.pmpEventService.searchForEventMeasurements(
        maintenanceProcedureDB.id,
        newStart,
      );

    let clonedMaintenanceProcedure: MaintenanceProcedure;
    if (cloneCrtMaintenanceProcedure) {
      const { clonedMaintenanceProcedure, extra } = await this.clone(
        maintenanceProcedureDB,
      );
      result = clonedMaintenanceProcedure;
      await this.maintenanceProceduresRepository.softRemove(
        maintenanceProcedureDB,
      );
    } else {
      await this.maintenanceProceduresRepository.save(maintenanceProcedureDB);
    }

    const startProject = dayjs(project.startDate);
    const endProject = startProject.add(2, 'years');

    if (
      project.status == ProjectStatus.draft &&
      (maintenanceProcedureDB.startDate !=
        oldMaintenanceProcedureDB.startDate ||
        maintenanceProcedureDB.frequency != oldMaintenanceProcedureDB.frequency)
    ) {
      //remove old events
      await this.pmpEventService.removeEventsForMaintenanceProcedure(
        maintenanceProcedureDB,
        project,
      );

      //create new events
      await this.pmpEventService.createEventsForMaintenanceProcedure(
        startProject,
        endProject,
        maintenanceProcedureDB,
        project,
      );
    }

    if (project.status == ProjectStatus.active) {
      if (
        maintenanceProcedureDB.startDate !=
          oldMaintenanceProcedureDB.startDate ||
        maintenanceProcedureDB.frequency != oldMaintenanceProcedureDB.frequency
      ) {
        //delete upcoming events
        await this.pmpEventService.removeEventsForMaintenanceProcedure(
          maintenanceProcedureDB,
          project,
          newStart,
        );
        //create new events
        await this.pmpEventService.createEventsForMaintenanceProcedure(
          newStart,
          endProject,
          cloneCrtMaintenanceProcedure
            ? clonedMaintenanceProcedure
            : maintenanceProcedureDB,
          project,
        );
      } else if (cloneCrtMaintenanceProcedure) {
        //set copy as procedure id for newer events
        await this.pmpEventService.updateEventsForMaintenanceProcedure(
          maintenanceProcedureDB,
          clonedMaintenanceProcedure,
          project,
          newStart,
        );
      }
    }
    return result;
  }

  async refreshEventsOnProjectStartDateUpdate(project: Project) {
    if (project.status == ProjectStatus.draft) {
      const startProject = dayjs(project.startDate);
      const endProject = startProject.add(2, 'years');

      const equipment = await this.equipmentsRepository.find({
        where: { project },
      });

      const maintenanceProcedures =
        await this.maintenanceProceduresRepository.find({
          where: { equipmentId: In(equipment.map((eq) => eq.id)) },
        });

      for (const maintenanceProcedure of maintenanceProcedures) {
        await this.pmpEventService.removeEventsForMaintenanceProcedure(
          maintenanceProcedure,
          project,
        );

        //create new events
        await this.pmpEventService.createEventsForMaintenanceProcedure(
          startProject,
          endProject,
          maintenanceProcedure,
          project,
        );
      }
    }
  }

  async clone(
    maintenanceProcedureToClone: MaintenanceProcedure,
    extraOptions?: {
      operation?: MaintenanceOperation;
      label?: MaintenanceOperationLabel;
      parameter?: MaintenanceOperationParameter;
    },
  ) {
    let extra = null;
    const maintenanceProcedure =
      await this.maintenanceProceduresRepository.findOne({
        where: { id: maintenanceProcedureToClone.id },
        relations: [
          'equipment',
          'subcontractor',
          'operations',
          'operations.labels',
          'operations.parameters',
          'operations.parameters.unit',
        ],
      });

    const maintenanceProcedureClone =
      this.maintenanceProceduresRepository.create({
        ...maintenanceProcedureToClone,
        operations: null,
        equipment: maintenanceProcedure.equipment,
        subcontractor: maintenanceProcedure.subcontractor,
        id: null,
      });
    await this.maintenanceProceduresRepository.save(maintenanceProcedureClone);

    for (const operation of maintenanceProcedure.operations) {
      const maintenanceOperationClone =
        this.maintenanceOperationsRepository.create({
          ...(extraOptions &&
          extraOptions.operation &&
          operation.id == extraOptions.operation.id
            ? extraOptions.operation
            : operation),
          labels: null,
          parameters: null,
          procedure: maintenanceProcedureClone,
          id: null,
        });

      await this.maintenanceOperationsRepository.save(
        maintenanceOperationClone,
      );
      if (
        extraOptions &&
        extraOptions.operation &&
        operation.id == extraOptions.operation.id
      )
        extra = maintenanceOperationClone;

      if (maintenanceOperationClone.type === OperationTypes.visual) {
        for (const operationLabel of operation.labels) {
          const maintenanceOperationLabelClone =
            this.maintenanceOperationLabelsRepository.create({
              ...(extraOptions &&
              extraOptions.label &&
              operationLabel.id == extraOptions.label.id
                ? extraOptions.label
                : operationLabel),
              operation: maintenanceOperationClone,
              id: null,
            });
          this.maintenanceOperationLabelsRepository.save(
            maintenanceOperationLabelClone,
          );
          if (
            extraOptions &&
            extraOptions.label &&
            operationLabel.id == extraOptions.label.id
          )
            extra = maintenanceOperationLabelClone;
        }
      }

      if (maintenanceOperationClone.type === OperationTypes.parameter) {
        for (const operationParameter of operation.parameters) {
          const maintenanceOperationParameterClone =
            this.maintenanceOperationParametersRepository.create({
              ...(extraOptions &&
              extraOptions.parameter &&
              operationParameter.id == extraOptions.parameter.id
                ? extraOptions.parameter
                : operationParameter),
              operation: maintenanceOperationClone,
              id: null,
            });
          this.maintenanceOperationParametersRepository.save(
            maintenanceOperationParameterClone,
          );
          if (
            extraOptions &&
            extraOptions.parameter &&
            operationParameter.id == extraOptions.parameter.id
          )
            extra = maintenanceOperationParameterClone;
        }
      }
    }

    return { clonedMaintenanceProcedure: maintenanceProcedureClone, extra };
  }

  async remove(id: number) {
    return await this.maintenanceProceduresRepository.delete({ id: id });
  }

  async getMaintenanceProceduresByEquipmentId(equipmentId: number) {
    const data = await this.maintenanceProceduresRepository.find({
      where: { equipment: { id: equipmentId } },
      relations: [
        'operations',
        'operations.labels',
        'operations.parameters',
        'operations.parameters.unit',
        'subcontractor',
      ],
    });

    return {
      total: data.length,
      data,
    };
  }
}
