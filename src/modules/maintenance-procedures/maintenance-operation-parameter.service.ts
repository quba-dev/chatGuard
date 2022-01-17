import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { PmpEventsService } from '../pmp-events/pmp-events.service';
import { ProjectStatus } from '../projects/enums/project-status.enum';
import { Unit } from '../units/entities/unit';
import { CreateMaintenanceOperationParameterDto } from './dto/create-maintenance-operation-parameter.dto';
import { UpdateMaintenanceOperationParameterDto } from './dto/update-maintenance-operation-parameter.dto';
import { MaintenanceOperation } from './entities/maintenance-operation';
import { MaintenanceOperationParameter } from './entities/maintenance-operation-parameter';
import { MaintenanceProcedure } from './entities/maintenance-procedure';
import { OperationTypes } from './enums/operation-types.enum';
import { MaintenanceProceduresService } from './maintenance-procedures.service';
import * as dayjs from 'dayjs';

@Injectable()
export class MaintenanceOperationParametersService {
  constructor(
    @InjectRepository(MaintenanceOperation)
    private maintenanceOperationsRepository: Repository<MaintenanceOperation>,
    @InjectRepository(MaintenanceOperationParameter)
    private maintenanceOperationParametersRepository: Repository<MaintenanceOperationParameter>,
    @InjectRepository(Unit)
    private unitsRepository: Repository<Unit>,
    @InjectRepository(MaintenanceProcedure)
    private maintenanceProceduresRepository: Repository<MaintenanceProcedure>,
    private readonly pmpEventService: PmpEventsService,
    private readonly maintenanceProceduresService: MaintenanceProceduresService,
    private config: AppConfig,
  ) {}

  async create(
    createMaintenanceOperationParameterDto: CreateMaintenanceOperationParameterDto,
  ) {
    const maintenanceOperationParameterData: DeepPartial<MaintenanceOperationParameter> =
      {
        ...createMaintenanceOperationParameterDto,
      };

    if (createMaintenanceOperationParameterDto.operationId) {
      const operation = await this.maintenanceOperationsRepository.findOne(
        createMaintenanceOperationParameterDto.operationId,
      );
      if (!operation)
        throw new BadRequestException(
          ErrorTypes.MAINTENANCE_OPERATION_NOT_FOUND,
        );
      if (operation.type != OperationTypes.parameter)
        throw new BadRequestException(
          ErrorTypes.YOU_CAN_ADD_PARAMETERS_ONLY_TO_PARAMETER_OPERATION,
        );

      maintenanceOperationParameterData.operation = operation;
    }

    if (createMaintenanceOperationParameterDto.unitId) {
      const unit = await this.unitsRepository.findOne(
        createMaintenanceOperationParameterDto.unitId,
      );
      if (!unit) throw new BadRequestException(ErrorTypes.UNIT_NOT_FOUND);
      maintenanceOperationParameterData.unit = unit;
    }

    const maintenanceOperationParameter =
      this.maintenanceOperationParametersRepository.create(
        maintenanceOperationParameterData,
      );
    return await this.maintenanceOperationParametersRepository.save(
      maintenanceOperationParameter,
    );
  }

  async update(
    id: number,
    updateMaintenanceOperationParameterDto: UpdateMaintenanceOperationParameterDto,
  ) {
    const maintenanceOperationParameterData: DeepPartial<MaintenanceOperationParameter> =
      {
        ...updateMaintenanceOperationParameterDto,
      };

    if (updateMaintenanceOperationParameterDto.unitId) {
      const unit = await this.unitsRepository.findOne(
        updateMaintenanceOperationParameterDto.unitId,
      );
      if (!unit) throw new BadRequestException(ErrorTypes.UNIT_NOT_FOUND);
      maintenanceOperationParameterData.unit = unit;
    }
    maintenanceOperationParameterData['id'] = id;

    const maintenanceOperationParameterDB =
      await this.maintenanceOperationParametersRepository.preload(
        maintenanceOperationParameterData,
      );
    let result = maintenanceOperationParameterDB;
    //-----------------------------------------------------------------------------------------------
    //clone maintenance procedure
    const aux = await this.maintenanceOperationParametersRepository.findOne({
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
          parameter: maintenanceOperationParameterDB,
        });
      result = extra;
      await this.maintenanceProceduresRepository.softRemove(
        maintenanceProcedureDB,
      );
    } else {
      await this.maintenanceOperationParametersRepository.save(
        maintenanceOperationParameterDB,
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
    return await this.maintenanceOperationParametersRepository.delete({
      id: id,
    });
  }
}
