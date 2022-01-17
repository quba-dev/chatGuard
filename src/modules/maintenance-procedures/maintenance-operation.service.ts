import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { CreateMaintenanceOperationDto } from './dto/create-maintenance-operation.dto';
import { UpdateMaintenanceOperationDto } from './dto/update-maintenance-operation.dto';
import { MaintenanceOperation } from './entities/maintenance-operation';
import { MaintenanceOperationLabel } from './entities/maintenance-operation-label';
import { MaintenanceOperationParameter } from './entities/maintenance-operation-parameter';
import { MaintenanceProcedure } from './entities/maintenance-procedure';
import { OperationTypes } from './enums/operation-types.enum';
import { PmpEventsService } from '../pmp-events/pmp-events.service';
import * as dayjs from 'dayjs';
import { MaintenanceProceduresService } from './maintenance-procedures.service';
import { ProjectStatus } from '../projects/enums/project-status.enum';

@Injectable()
export class MaintenanceOperationsService {
  constructor(
    @InjectRepository(MaintenanceOperation)
    private maintenanceOperationsRepository: Repository<MaintenanceOperation>,
    @InjectRepository(MaintenanceOperationLabel)
    private maintenanceOperationLabelsRepository: Repository<MaintenanceOperationLabel>,
    @InjectRepository(MaintenanceOperationParameter)
    private maintenanceOperationParametersRepository: Repository<MaintenanceOperationParameter>,
    @InjectRepository(MaintenanceProcedure)
    private maintenanceProceduresRepository: Repository<MaintenanceProcedure>,
    private readonly pmpEventService: PmpEventsService,
    private readonly maintenanceProceduresService: MaintenanceProceduresService,
    private config: AppConfig,
  ) {}

  async create(createMaintenanceOperationDto: CreateMaintenanceOperationDto) {
    const maintenanceOperationData: DeepPartial<MaintenanceOperation> = {
      ...createMaintenanceOperationDto,
    };

    if (createMaintenanceOperationDto.procedureId) {
      const equipment = await this.maintenanceProceduresRepository.findOne(
        createMaintenanceOperationDto.procedureId,
      );
      if (!equipment)
        throw new BadRequestException(
          ErrorTypes.MAINTENANCE_PROCEDURE_NOT_FOUND,
        );

      maintenanceOperationData.procedure = equipment;
    }

    const maintenanceOperation = this.maintenanceOperationsRepository.create(
      maintenanceOperationData,
    );
    return await this.maintenanceOperationsRepository.save(
      maintenanceOperation,
    );
  }

  async update(
    id: number,
    updateMaintenanceOperationDto: UpdateMaintenanceOperationDto,
  ) {
    const maintenanceOperationData: DeepPartial<MaintenanceOperation> = {
      ...updateMaintenanceOperationDto,
    };

    maintenanceOperationData['id'] = id;

    const maintenanceOperationDB =
      await this.maintenanceOperationsRepository.preload(
        maintenanceOperationData,
      );
    let result = maintenanceOperationDB;

    //-----------------------------------------------------------------------------------------------
    //clone maintenance procedure
    const aux = await this.maintenanceOperationsRepository.findOne({
      where: { id },
      relations: [
        'procedure',
        'procedure.equipment',
        'procedure.equipment.project',
      ],
    });
    const project = aux.procedure.equipment.project;
    const maintenanceProcedureDB = aux.procedure;

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
          operation: maintenanceOperationDB,
        });
      result = extra;
      await this.maintenanceProceduresRepository.softRemove(
        maintenanceProcedureDB,
      );
    } else {
      await this.maintenanceOperationsRepository.save(maintenanceOperationDB);
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

    if (maintenanceOperationDB.type === OperationTypes.visual) {
      this.maintenanceOperationParametersRepository.delete({
        operation: { id: maintenanceOperationDB.id },
      });
    }
    if (maintenanceOperationDB.type === OperationTypes.parameter) {
      this.maintenanceOperationLabelsRepository.delete({
        operation: { id: maintenanceOperationDB.id },
      });
    }

    return result;
  }

  async remove(id: number) {
    return await this.maintenanceOperationsRepository.delete({ id: id });
  }
}
