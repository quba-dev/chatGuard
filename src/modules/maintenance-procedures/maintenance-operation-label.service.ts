import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { PmpEventsService } from '../pmp-events/pmp-events.service';
import { ProjectStatus } from '../projects/enums/project-status.enum';
import { CreateMaintenanceOperationLabelDto } from './dto/create-maintenance-operation-label.dto';
import { UpdateMaintenanceOperationLabelDto } from './dto/update-maintenance-operation-label.dto';
import { MaintenanceOperation } from './entities/maintenance-operation';
import { MaintenanceOperationLabel } from './entities/maintenance-operation-label';
import { MaintenanceProcedure } from './entities/maintenance-procedure';
import { OperationTypes } from './enums/operation-types.enum';
import { MaintenanceProceduresService } from './maintenance-procedures.service';
import * as dayjs from 'dayjs';

@Injectable()
export class MaintenanceOperationLabelsService {
  constructor(
    @InjectRepository(MaintenanceOperation)
    private maintenanceOperationsRepository: Repository<MaintenanceOperation>,
    @InjectRepository(MaintenanceOperationLabel)
    private maintenanceOperationLabelsRepository: Repository<MaintenanceOperationLabel>,
    @InjectRepository(MaintenanceProcedure)
    private maintenanceProceduresRepository: Repository<MaintenanceProcedure>,
    private readonly pmpEventService: PmpEventsService,
    private readonly maintenanceProceduresService: MaintenanceProceduresService,
    private config: AppConfig,
  ) {}

  async create(
    createMaintenanceOperationLabelDto: CreateMaintenanceOperationLabelDto,
  ) {
    const maintenanceOperationLabelData: DeepPartial<MaintenanceOperationLabel> =
      {
        ...createMaintenanceOperationLabelDto,
      };

    if (createMaintenanceOperationLabelDto.operationId) {
      const operation = await this.maintenanceOperationsRepository.findOne(
        createMaintenanceOperationLabelDto.operationId,
      );
      if (!operation)
        throw new BadRequestException(
          ErrorTypes.MAINTENANCE_OPERATION_NOT_FOUND,
        );
      if (operation.type != OperationTypes.visual)
        throw new BadRequestException(
          ErrorTypes.YOU_CAN_ADD_LABELS_ONLY_TO_VISUAL_OPERATION,
        );
      maintenanceOperationLabelData.operation = operation;
    }

    const maintenanceOperationLabel =
      this.maintenanceOperationLabelsRepository.create(
        maintenanceOperationLabelData,
      );
    return await this.maintenanceOperationLabelsRepository.save(
      maintenanceOperationLabel,
    );
  }

  async update(
    id: number,
    updateMaintenanceOperationLabelDto: UpdateMaintenanceOperationLabelDto,
  ) {
    const maintenanceOperationLabelData: DeepPartial<MaintenanceOperationLabel> =
      {
        ...updateMaintenanceOperationLabelDto,
      };
    maintenanceOperationLabelData['id'] = id;

    const maintenanceOperationLabelDB =
      await this.maintenanceOperationLabelsRepository.preload(
        maintenanceOperationLabelData,
      );
    let result = maintenanceOperationLabelDB;

    //-----------------------------------------------------------------------------------------------
    //clone maintenance procedure
    const aux = await this.maintenanceOperationLabelsRepository.findOne({
      where: { id },
      relations: [
        'operation',
        'operation.procedure',
        'operation.procedure.equipment',
        'operation.procedure.equipment.project',
      ],
    });
    const project = aux.operation.procedure.equipment.project;
    const maintenanceProcedureDB = aux.operation.procedure;

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
      const { clonedMaintenanceProcedure, extra } =
        await this.maintenanceProceduresService.clone(maintenanceProcedureDB, {
          label: maintenanceOperationLabelDB,
        });
      result = extra;
      await this.maintenanceProceduresRepository.softRemove(
        maintenanceProcedureDB,
      );
    } else {
      await this.maintenanceOperationLabelsRepository.save(
        maintenanceOperationLabelDB,
      );
    }

    if (project.status == ProjectStatus.active) {
      if (cloneCrtMaintenanceProcedure) {
        //set copy as procedure id for newer events
        await this.pmpEventService.updateEventsForMaintenanceProcedure(
          maintenanceProcedureDB,
          clonedMaintenanceProcedure,
          project,
          newStart,
        );
      }
    }
    //-----------------------------------------------------------------------------------------------

    return result;
  }

  async remove(id: number) {
    return await this.maintenanceOperationLabelsRepository.delete({ id: id });
  }
}
