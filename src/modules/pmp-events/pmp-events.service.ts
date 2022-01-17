import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { buildGetEventFilterObject } from '../../util/filter';
import {
  Repository,
  MoreThanOrEqual,
  LessThanOrEqual,
  Between,
  DeepPartial,
  In,
  Not,
  ILike,
} from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { Equipment } from '../equipments/entities/equipment.entity';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { File } from '../files/entities/file.entity';
import { MaintenanceOperation } from '../maintenance-procedures/entities/maintenance-operation';
import { MaintenanceOperationLabel } from '../maintenance-procedures/entities/maintenance-operation-label';
import { MaintenanceOperationParameter } from '../maintenance-procedures/entities/maintenance-operation-parameter';
import { MaintenanceProcedure } from '../maintenance-procedures/entities/maintenance-procedure';
import { ProcedureFrequency } from '../maintenance-procedures/enums/procedure-frequency.enum';
import { Project } from '../projects/entities/project.entity';
import { CreatePmpEventMeasurementDto } from './dto/create-pmp-event-measurement.dto';
import { CreatePmpEventOperationDataDto } from './dto/create-pmp-event-operation-data.dto';
import { UpdatePmpEventDto } from './dto/update-pmp-event.dto';
import { PmpEventLogItem } from './entities/pmp-event-log-item.entity';
import { PmpEventMeasurement } from './entities/pmp-event-measurement.entity';
import { PmpEventOperationData } from './entities/pmp-event-operation-data.entity';
import { PmpEvent } from './entities/pmp-event.entity';
import { PmpEventLogTypes } from './enums/pmp-event-log-types';
import { PmpEventStatus } from './enums/pmp-event-status';

@Injectable()
export class PmpEventsService {
  constructor(
    @InjectRepository(PmpEvent)
    private pmpEventsRepository: Repository<PmpEvent>,
    @InjectRepository(PmpEventMeasurement)
    private pmpEventMeasurementsRepository: Repository<PmpEventMeasurement>,
    @InjectRepository(PmpEventOperationData)
    private pmpEventOperationsDataRepository: Repository<PmpEventOperationData>,
    @InjectRepository(MaintenanceOperationLabel)
    private maintenanceOperationLabelsRepository: Repository<MaintenanceOperationLabel>,
    @InjectRepository(MaintenanceOperationParameter)
    private maintenanceOperationParametersRepository: Repository<MaintenanceOperationParameter>,
    @InjectRepository(MaintenanceOperation)
    private maintenanceOperationsRepository: Repository<MaintenanceOperation>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    @InjectRepository(Equipment)
    private equipmentsRepository: Repository<Equipment>,
    @InjectRepository(PmpEventLogItem)
    private pmpEventLogItemsRepository: Repository<PmpEventLogItem>,
    private config: AppConfig,
  ) {}

  async createEventsForMaintenanceProcedure(
    start: dayjs.Dayjs,
    end: dayjs.Dayjs,
    maintenanceProcedure: MaintenanceProcedure,
    project: Project,
  ) {
    const maintenanceProcedureEvents = [];
    let interval = 0;
    let intervalUnit: dayjs.OpUnitType = 'week';

    if (maintenanceProcedure.frequency == ProcedureFrequency.weekly) {
      interval = 1;
      intervalUnit = 'week';
    }
    if (maintenanceProcedure.frequency == ProcedureFrequency.monthly) {
      interval = 1;
      intervalUnit = 'month';
    }
    if (maintenanceProcedure.frequency == ProcedureFrequency.quarterly) {
      interval = 3;
      intervalUnit = 'months';
    }
    if (maintenanceProcedure.frequency == ProcedureFrequency.semiannually) {
      interval = 6;
      intervalUnit = 'months';
    }
    if (maintenanceProcedure.frequency == ProcedureFrequency.annually) {
      interval = 1;
      intervalUnit = 'year';
    }

    let maintenanceProcedureStart = start;
    if (maintenanceProcedure.startDate)
      maintenanceProcedureStart = dayjs(maintenanceProcedure.startDate);

    while (maintenanceProcedureStart.isBefore(start) && interval > 0) {
      maintenanceProcedureStart = maintenanceProcedureStart.add(
        interval,
        intervalUnit,
      );
    }

    let eventDate = maintenanceProcedureStart;
    while (eventDate.isBefore(end)) {
      maintenanceProcedureEvents.push(
        this.pmpEventsRepository.create({
          procedure: maintenanceProcedure,
          project: project,
          date: eventDate.toDate(),
          status: PmpEventStatus.planned,
        }),
      );

      eventDate = eventDate.add(interval, intervalUnit);
    }

    await this.pmpEventsRepository.save(maintenanceProcedureEvents);
  }

  async removeEventsForMaintenanceProcedure(
    maintenanceProcedure: MaintenanceProcedure,
    project: Project,
    start: dayjs.Dayjs = null,
    end: dayjs.Dayjs = null,
  ) {
    const conditions = {
      procedure: maintenanceProcedure,
      project: project,
    };
    if (start) {
      conditions['date'] = MoreThanOrEqual(start.toDate());
    }
    if (end) {
      conditions['date'] = LessThanOrEqual(end.toDate());
    }
    try {
      await this.pmpEventsRepository.delete(conditions);
    } catch (e) {}
  }

  async updateEventsForMaintenanceProcedure(
    maintenanceProcedure: MaintenanceProcedure,
    newMaintenanceProcedure: MaintenanceProcedure,
    project: Project,
    start: dayjs.Dayjs = null,
    end: dayjs.Dayjs = null,
  ) {
    const conditions = {
      procedure: maintenanceProcedure,
      project: project,
    };
    if (start) {
      conditions['date'] = MoreThanOrEqual(start.toDate());
    }
    if (end) {
      conditions['date'] = LessThanOrEqual(end.toDate());
    }
    await this.pmpEventsRepository.update(conditions, {
      procedure: newMaintenanceProcedure,
    });
  }

  async saveEventMeasurement(
    eventId: number,
    createPmpEventMeasurementDto: CreatePmpEventMeasurementDto,
    userId: number,
  ) {
    if (
      !createPmpEventMeasurementDto.labelId &&
      !createPmpEventMeasurementDto.parameterId
    ) {
      throw new BadRequestException(
        ErrorTypes.YOU_NEDD_TO_SET_EITHER_A_LABEL_OR_A_PARAMETER,
      );
    }

    const event = await this.pmpEventsRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new BadRequestException(ErrorTypes.INVALID_EVENT_ID);
    }

    const operation = await this.maintenanceOperationsRepository.findOne(
      createPmpEventMeasurementDto.operationId,
    );
    if (!operation) {
      throw new BadRequestException(ErrorTypes.INVALID_OPERATION_ID);
    }

    let label: MaintenanceOperationLabel;
    let parameter: MaintenanceOperationParameter;

    if (createPmpEventMeasurementDto.labelId) {
      label = await this.maintenanceOperationLabelsRepository.findOne(
        createPmpEventMeasurementDto.labelId,
      );
      if (!label) {
        throw new BadRequestException(ErrorTypes.INVALID_LABEL_ID);
      }
    }

    if (createPmpEventMeasurementDto.parameterId) {
      parameter = await this.maintenanceOperationParametersRepository.findOne(
        createPmpEventMeasurementDto.parameterId,
      );
      if (!parameter) {
        throw new BadRequestException(ErrorTypes.INVALID_PARAMETER_ID);
      }
    }

    let operationType = PmpEventLogTypes.updateMeasurement;
    let measurement = await this.pmpEventMeasurementsRepository.findOne({
      where: {
        event: { id: eventId },
        operation,
        ...(createPmpEventMeasurementDto.parameterId
          ? { parameter: parameter }
          : {}),
      },
    });
    if (!measurement) {
      operationType = PmpEventLogTypes.createMeasurement;
      measurement = this.pmpEventMeasurementsRepository.create({
        event: { id: eventId },
        operation,
      });
    }

    if (label) measurement.label = label;
    if (parameter) measurement.parameter = parameter;
    if (typeof createPmpEventMeasurementDto.feedback !== 'undefined') {
      measurement.feedback = createPmpEventMeasurementDto.feedback;
    }
    measurement.parameterValue = createPmpEventMeasurementDto.parameterValue;

    if (createPmpEventMeasurementDto.fileIds) {
      const files = [];
      for (const fileId of createPmpEventMeasurementDto.fileIds) {
        try {
          const file = await this.filesRepository.findOne(fileId);
          if (file) {
            files.push(file);
          }
        } catch (e) {}
      }
      measurement.files = files;
    }

    await this.pmpEventMeasurementsRepository.save(measurement);

    if (event.status === PmpEventStatus.open) {
      event.status = PmpEventStatus.inProgress;
      await this.pmpEventsRepository.save(event);

      const logItem = this.pmpEventLogItemsRepository.create({
        user: { id: userId },
        operation: {
          type: PmpEventLogTypes.changeStatus,
          status: PmpEventStatus.inProgress,
          previousStatus: PmpEventStatus.open,
        },
        event,
        comment: '',
      });
      this.pmpEventLogItemsRepository.save(logItem);
    }

    const logItem = this.pmpEventLogItemsRepository.create({
      user: { id: userId },
      operation: {
        type: operationType,
        measurementId: measurement.id,
      },
      event,
      comment: '',
    });
    this.pmpEventLogItemsRepository.save(logItem);
    return true;
  }

  async saveEventOperationData(
    eventId: number,
    createPmpEventOperationDataDto: CreatePmpEventOperationDataDto,
    userId: number,
  ) {
    const event = await this.pmpEventsRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new BadRequestException(ErrorTypes.INVALID_EVENT_ID);
    }

    const operation = await this.maintenanceOperationsRepository.findOne(
      createPmpEventOperationDataDto.operationId,
    );
    if (!operation) {
      throw new BadRequestException(ErrorTypes.INVALID_OPERATION_ID);
    }

    let operationType = PmpEventLogTypes.updateOperationData;
    let operationData = await this.pmpEventOperationsDataRepository.findOne({
      where: {
        event: { id: eventId },
        operation,
      },
    });

    if (!operationData) {
      operationType = PmpEventLogTypes.createOperationData;
      operationData = this.pmpEventOperationsDataRepository.create({
        event: { id: eventId },
        operation,
      });
    }

    if (typeof createPmpEventOperationDataDto.feedback !== 'undefined') {
      operationData.feedback = createPmpEventOperationDataDto.feedback;
    }

    if (createPmpEventOperationDataDto.fileIds) {
      const files = [];
      for (const fileId of createPmpEventOperationDataDto.fileIds) {
        try {
          const file = await this.filesRepository.findOne(fileId);
          if (file) {
            files.push(file);
          }
        } catch (e) {}
      }
      operationData.files = files;
    }

    await this.pmpEventOperationsDataRepository.save(operationData);

    if (event.status === PmpEventStatus.open) {
      event.status = PmpEventStatus.inProgress;
      await this.pmpEventsRepository.save(event);

      const logItem = this.pmpEventLogItemsRepository.create({
        user: { id: userId },
        operation: {
          type: PmpEventLogTypes.changeStatus,
          status: PmpEventStatus.inProgress,
          previousStatus: PmpEventStatus.open,
        },
        event,
        comment: '',
      });
      this.pmpEventLogItemsRepository.save(logItem);
    }

    const logItem = this.pmpEventLogItemsRepository.create({
      user: { id: userId },
      operation: {
        type: operationType,
        operationId: operationData.id,
      },
      event,
      comment: operationData.feedback,
      files: operationData.files,
    });
    this.pmpEventLogItemsRepository.save(logItem);
    return true;
  }

  async getEventsByProjectId(
    projectId: number,
    start: string,
    stop: string,
    filter: string,
    search: string,
  ) {
    let startDate: dayjs.Dayjs;
    let stopDate: dayjs.Dayjs;

    const filterObject = buildGetEventFilterObject(filter);

    if (search) {
      if (filterObject.procedure?.equipment) {
        filterObject.procedure.equipment['name'] = ILike(`%${search}%`);
      } else {
        if (filterObject.procedure) {
          filterObject.procedure['equipment'] = { name: ILike(`%${search}%`) };
        } else {
          filterObject['procedure'] = {
            equipment: { name: ILike(`%${search}%`) },
          };
        }
      }
    }

    try {
      if (!start || !stop) throw new Error();
      startDate = dayjs(start).set('hour', 0).set('minute', 0).set('second', 0);
      stopDate = dayjs(stop)
        .set('hour', 23)
        .set('minute', 59)
        .set('second', 59);
      if (stopDate.isBefore(startDate)) throw new Error();
    } catch (e) {
      throw new BadRequestException(ErrorTypes.INVALID_DATES);
    }

    const project = await this.projectsRepository.findOne(projectId);
    if (!project) {
      throw new BadRequestException(ErrorTypes.INVALID_PROJECT_ID);
    }

    const events = await this.pmpEventsRepository.find({
      withDeleted: true,
      where: {
        project: { id: projectId },
        date: Between(startDate.toDate(), stopDate.toDate()),
        ...filterObject,
      },
      relations: [
        'procedure',
        'procedure.equipment',
        'procedure.equipment.building',
        'procedure.equipment.buildingLevel',
        'procedure.equipment.buildingRoom',
        // 'procedure.operations',
        // 'procedure.operations.labels',
        // 'procedure.operations.parameters',
        // 'procedure.operations.parameters.unit',
        // 'measurements',
      ],
    });

    return {
      total: events.length,
      data: events,
    };
  }

  async getInProgressEventsByProjectId(projectId: number) {
    return await this.getEventsByProjectIdAndStatus(projectId, [
      PmpEventStatus.open,
      PmpEventStatus.inProgress,
      PmpEventStatus.onHold,
    ]);
  }

  async getResolvedEventsByProjectId(projectId: number) {
    return await this.getEventsByProjectIdAndStatus(projectId, [
      PmpEventStatus.resolved,
    ]);
  }

  async getEventsByProjectIdAndStatus(
    projectId: number,
    status: PmpEventStatus[],
  ) {
    const project = await this.projectsRepository.findOne(projectId);
    if (!project) {
      throw new BadRequestException(ErrorTypes.INVALID_PROJECT_ID);
    }

    const events = await this.pmpEventsRepository.find({
      withDeleted: true,
      where: {
        project: { id: projectId },
        status: status.length == 1 ? status[0] : In(status),
      },
      relations: [
        'procedure',
        'procedure.equipment',
        'procedure.equipment.building',
        'procedure.equipment.buildingLevel',
        'procedure.equipment.buildingRoom',
      ],
    });

    return {
      total: events.length,
      data: events,
    };
  }

  async findOne(id: number) {
    const event = await this.pmpEventsRepository.findOne({
      withDeleted: true,
      where: {
        id,
      },
      relations: [
        'procedure',
        'procedure.equipment',
        'procedure.equipment.building',
        'procedure.equipment.buildingLevel',
        'procedure.equipment.buildingRoom',
        'procedure.operations',
        'procedure.operations.labels',
        'procedure.operations.parameters',
        'procedure.operations.parameters.unit',
        'measurements',
        'measurements.files',
        'operationsData',
        'operationsData.files',
        'log',
        'log.user',
        'log.files',
        'files',
      ],
    });

    return event;
  }

  async searchForEventMeasurements(
    maintenanceProcedureId: number,
    endDate: dayjs.Dayjs,
  ) {
    const events = await this.pmpEventsRepository.find({
      where: {
        procedure: { id: maintenanceProcedureId },
        date: LessThanOrEqual(endDate.toDate()),
      },
      relations: ['measurements'],
    });
    if (events.length == 0) return false;
    for (const event of events) {
      if (event.measurements.length > 0) return true;
    }
    return false;
  }

  async updateEvent(
    id: number,
    updatePmpEventDto: UpdatePmpEventDto,
    userId: number,
  ) {
    const oldPmpEventDB = await this.pmpEventsRepository.findOne(id);
    if (!oldPmpEventDB)
      throw new BadRequestException(ErrorTypes.PMP_EVENT_NOT_FOUND);

    const pmpEventData: DeepPartial<PmpEvent> = {
      ...updatePmpEventDto,
    };
    pmpEventData['id'] = id;

    if (updatePmpEventDto.fileIds) {
      const files = [];
      for (const fileId of updatePmpEventDto.fileIds) {
        try {
          const file = await this.filesRepository.findOne(fileId);
          if (file) {
            files.push(file);
          }
        } catch (e) {}
      }
      pmpEventData.files = files;
    }

    const commentFiles = [];
    if (updatePmpEventDto.commentFileIds) {
      for (const fileId of updatePmpEventDto.commentFileIds) {
        try {
          const file = await this.filesRepository.findOne(fileId);
          if (file) {
            commentFiles.push(file);
          }
        } catch (e) {}
      }
    }

    const pmpEventDB = await this.pmpEventsRepository.preload(pmpEventData);
    await this.pmpEventsRepository.save(pmpEventDB);

    if (updatePmpEventDto.status === PmpEventStatus.open) {
      const event = await this.pmpEventsRepository.findOne({
        where: { id },
        relations: ['procedure', 'procedure.equipment'],
      });
      const equipment = event.procedure.equipment;
      equipment.isDeletable = false;
      await this.equipmentsRepository.save(equipment);
    }

    if (updatePmpEventDto.status) {
      const logItem = this.pmpEventLogItemsRepository.create({
        user: { id: userId },
        operation: {
          type: PmpEventLogTypes.changeStatus,
          status: updatePmpEventDto.status,
          previousStatus: oldPmpEventDB.status,
        },
        event: { id },
        comment: updatePmpEventDto.comment,
        files: commentFiles,
      });
      await this.pmpEventLogItemsRepository.save(logItem);
    }

    if (updatePmpEventDto.date && pmpEventDB.date != updatePmpEventDto.date) {
      const logItem = this.pmpEventLogItemsRepository.create({
        user: { id: userId },
        operation: {
          type: PmpEventLogTypes.changeDate,
          date: updatePmpEventDto.date,
        },
        event: { id },
        comment: updatePmpEventDto.comment,
        files: commentFiles,
      });
      await this.pmpEventLogItemsRepository.save(logItem);
    }

    return pmpEventDB;
  }

  async getEventsByProjectIdYearly(
    projectId: number,
    start: string,
    stop: string,
    filter: string,
    search: string,
  ) {
    let startDate: dayjs.Dayjs;
    let stopDate: dayjs.Dayjs;

    const filterObject = buildGetEventFilterObject(filter);

    if (search) {
      if (filterObject.procedure?.equipment) {
        filterObject.procedure.equipment['name'] = ILike(`%${search}%`);
      } else {
        if (filterObject.procedure) {
          filterObject.procedure['equipment'] = { name: ILike(`%${search}%`) };
        } else {
          filterObject['procedure'] = {
            equipment: { name: ILike(`%${search}%`) },
          };
        }
      }
    }

    const project = await this.projectsRepository.findOne(projectId);
    if (!project) {
      throw new BadRequestException(ErrorTypes.INVALID_PROJECT_ID);
    }

    try {
      if (!start || !stop) throw new Error();
      startDate = dayjs(start).startOf('week');
      stopDate = dayjs(stop).endOf('week');
      if (stopDate.isBefore(startDate)) throw new Error();

      const projectEndDate = dayjs(project.startDate).add(2, 'years');
      if (stopDate.isAfter(projectEndDate)) stopDate = projectEndDate;

      if (startDate.isAfter(projectEndDate)) throw new Error();
    } catch (e) {
      throw new BadRequestException(ErrorTypes.INVALID_DATES);
    }

    let startDateWeek = startDate;
    let stopDateWeek = startDateWeek.endOf('week');

    const events = [];
    while (stopDateWeek.isBefore(stopDate)) {
      stopDateWeek = startDateWeek.endOf('week');
      if (stopDateWeek.isAfter(stopDate)) stopDateWeek = stopDate;

      const weekEventsCount = await this.pmpEventsRepository.count({
        withDeleted: true,
        where: {
          project: { id: projectId },
          date: Between(startDateWeek.toDate(), stopDateWeek.toDate()),
          ...filterObject,
        },
        relations: ['procedure', 'procedure.equipment'],
      });

      const weekEvents = await this.pmpEventsRepository.find({
        withDeleted: true,
        where: {
          project: { id: projectId },
          date: Between(startDateWeek.toDate(), stopDateWeek.toDate()),
          ...filterObject,
        },
        relations: ['procedure', 'procedure.equipment'],
        take: 5,
      });

      const weekEventsSimplified = [];
      for (const event of weekEvents) {
        weekEventsSimplified.push({
          eventId: event.id,
          status: event.status,
          equipmentName: event.procedure.equipment.name,
          procedureFrequency: event.procedure.frequency,
        });
      }
      events.push({
        count: weekEventsCount,
        events: weekEventsSimplified,
        startDate: startDateWeek.toISOString(),
        stopDate: stopDateWeek.toISOString(),
      });

      startDateWeek = stopDateWeek.add(1, 'second');
    }

    return {
      total: events.length,
      data: events,
    };
  }

  async getEventsByProjectIdSimplified(
    projectId: number,
    start: string,
    stop: string,
    filter: string,
    search: string,
  ) {
    let startDate: dayjs.Dayjs;
    let stopDate: dayjs.Dayjs;

    const filterObject = buildGetEventFilterObject(filter);

    if (search) {
      if (filterObject.procedure?.equipment) {
        filterObject.procedure.equipment['name'] = ILike(`%${search}%`);
      } else {
        if (filterObject.procedure) {
          filterObject.procedure['equipment'] = { name: ILike(`%${search}%`) };
        } else {
          filterObject['procedure'] = {
            equipment: { name: ILike(`%${search}%`) },
          };
        }
      }
    }

    try {
      if (!start || !stop) throw new Error();
      startDate = dayjs(start).set('hour', 0).set('minute', 0).set('second', 0);
      stopDate = dayjs(stop)
        .set('hour', 23)
        .set('minute', 59)
        .set('second', 59);
      if (stopDate.isBefore(startDate)) throw new Error();
    } catch (e) {
      throw new BadRequestException(ErrorTypes.INVALID_DATES);
    }

    const project = await this.projectsRepository.findOne(projectId);
    if (!project) {
      throw new BadRequestException(ErrorTypes.INVALID_PROJECT_ID);
    }

    const events = await this.pmpEventsRepository.find({
      withDeleted: true,
      where: {
        project: { id: projectId },
        date: Between(startDate.toDate(), stopDate.toDate()),
        ...filterObject,
      },
      relations: ['procedure', 'procedure.equipment'],
    });

    const eventsSimplified = [];
    for (const event of events) {
      eventsSimplified.push({
        eventId: event.id,
        status: event.status,
        equipmentName: event.procedure.equipment.name,
        procedureFrequency: event.procedure.frequency,
      });
    }

    return {
      total: events.length,
      data: eventsSimplified,
    };
  }
}
