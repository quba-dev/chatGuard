import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';

import { Between, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { DailycheckOperationLabel } from '../dailycheck-procedures/entities/dailycheck-operation-label.entity';
import { DailycheckOperationParameter } from '../dailycheck-procedures/entities/dailycheck-operation-parameter.entity';
import { DailycheckOperation } from '../dailycheck-procedures/entities/dailycheck-operation.entity';
import { DailycheckProcedure } from '../dailycheck-procedures/entities/dailycheck-procedure.entity';
import { Equipment } from '../equipments/entities/equipment.entity';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { CreatePmpDCEventMeasurementDto } from '../pmp-dc-events/dto/create-pmp-dc-event-measurement.dto';
import { Project } from '../projects/entities/project.entity';
import { CreatePmpDCEventOperationDataDto } from './dto/create-pmp-dc-event-operation-data.dto';
import { CreatePmpDcEventDto } from './dto/create-pmp-dc-event.dto';
import { UpdatePmpDcEventDto } from './dto/update-pmp-dc-event.dto';
import { PmpDCEventLogItem } from './entities/pmp-dc-event-log-item.entity';
import { PmpDCEventMeasurement } from './entities/pmp-dc-event-measurement.entity';
import { PmpDCEventOperationData } from './entities/pmp-dc-event-operation-data.entity';
import { PmpDCEvent } from './entities/pmp-dc-event.entity';
import { PmpDCEventLogTypes } from './enums/pmp-dc-event-log-types';
import { PmpDCEventStatus } from './enums/pmp-dc-event-status';
import { File } from '../files/entities/file.entity';
import { PmpDC } from './entities/pmp-dc.entity';
import { ProjectStatus } from '../projects/enums/project-status.enum';

@Injectable()
export class PmpDcEventsService {
  constructor(
    @InjectRepository(DailycheckProcedure)
    private dailycheckProceduresRepository: Repository<DailycheckProcedure>,
    @InjectRepository(DailycheckOperation)
    private dailycheckOperationsRepository: Repository<DailycheckOperation>,
    @InjectRepository(DailycheckOperationLabel)
    private dailycheckOperationLabelsRepository: Repository<DailycheckOperationLabel>,
    @InjectRepository(DailycheckOperationParameter)
    private dailycheckOperationParametersRepository: Repository<DailycheckOperationParameter>,
    @InjectRepository(PmpDC)
    private pmpDCsRepository: Repository<PmpDC>,
    @InjectRepository(PmpDCEvent)
    private pmpDCEventsRepository: Repository<PmpDCEvent>,
    @InjectRepository(Equipment)
    private equipmentsRepository: Repository<Equipment>,
    @InjectRepository(PmpDCEventLogItem)
    private pmpDCEventLogItemsRepository: Repository<PmpDCEventLogItem>,
    @InjectRepository(PmpDCEventMeasurement)
    private pmpDCEventMeasurementsRepository: Repository<PmpDCEventMeasurement>,
    @InjectRepository(PmpDCEventOperationData)
    private pmpDCEventOperationsDataRepository: Repository<PmpDCEventOperationData>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    private config: AppConfig,
  ) {}

  async create(createPmpDcEventDto: CreatePmpDcEventDto) {
    const start = dayjs()
      .set('hour', 0)
      .set('minute', 0)
      .set('second', 0)
      .set('millisecond', 0);
    const stop = dayjs()
      .set('hour', 23)
      .set('minute', 59)
      .set('second', 59)
      .set('millisecond', 59);

    const dailyCheck = await this.pmpDCsRepository.findOne(
      createPmpDcEventDto.dailyCheckId,
    );
    if (!dailyCheck)
      throw new BadRequestException(ErrorTypes.DAILYCHECK_NOT_FOUND);

    let event = await this.pmpDCEventsRepository.findOne({
      where: { date: Between(start.toDate(), stop.toDate()), dailyCheck },
      relations: ['procedure'],
    });
    if (event) return event;
    const dailyCheckProcedure =
      await this.dailycheckProceduresRepository.findOne({
        where: { id: createPmpDcEventDto.dailyCheckProcedureId },
      });

    if (!dailyCheckProcedure) {
      throw new BadRequestException(ErrorTypes.DAILYCHECK_PROCEDURE_NOT_FOUND);
    }

    event = this.pmpDCEventsRepository.create({
      procedure: dailyCheckProcedure,
      project: dailyCheckProcedure.project,
      date: new Date(),
      status: PmpDCEventStatus.planned,
      dailyCheck,
    });

    await this.pmpDCEventsRepository.save(event);
    return event;
  }

  async update(id: number, updatePmpDcEventDto: UpdatePmpDcEventDto, userId) {
    const event = await this.pmpDCEventsRepository.findOne({
      where: { id },
      relations: ['procedure', 'procedure.equipment'],
    });
    if (!event) throw new BadRequestException(ErrorTypes.DC_EVENT_NOT_FOUND);

    event.status = updatePmpDcEventDto.status;

    if (updatePmpDcEventDto.status === PmpDCEventStatus.open) {
      const equipment = event.procedure.equipment;
      if (equipment) {
        equipment.isDeletable = false;
        await this.equipmentsRepository.save(equipment);
      }
    }

    if (updatePmpDcEventDto.status) {
      const logItem = this.pmpDCEventLogItemsRepository.create({
        user: { id: userId },
        operation: {
          type: PmpDCEventLogTypes.changeStatus,
          status: updatePmpDcEventDto.status,
        },
        event: { id },
        comment: updatePmpDcEventDto.comment,
      });
      this.pmpDCEventLogItemsRepository.save(logItem);
    }

    await this.pmpDCEventsRepository.save(event);
    return true;
  }

  async saveEventMeasurement(
    eventId: number,
    createPmpDCEventMeasurementDto: CreatePmpDCEventMeasurementDto,
    userId: number,
  ) {
    if (
      !createPmpDCEventMeasurementDto.labelId &&
      !createPmpDCEventMeasurementDto.parameterId
    ) {
      throw new BadRequestException(
        ErrorTypes.YOU_NEDD_TO_SET_EITHER_A_LABEL_OR_A_PARAMETER,
      );
    }

    const event = await this.pmpDCEventsRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new BadRequestException(ErrorTypes.INVALID_EVENT_ID);
    }

    const operation = await this.dailycheckProceduresRepository.findOne(
      createPmpDCEventMeasurementDto.operationId,
    );
    if (!operation) {
      throw new BadRequestException(ErrorTypes.INVALID_OPERATION_ID);
    }

    let label: DailycheckOperationLabel;
    let parameter: DailycheckOperationParameter;

    if (createPmpDCEventMeasurementDto.labelId) {
      label = await this.dailycheckOperationLabelsRepository.findOne(
        createPmpDCEventMeasurementDto.labelId,
      );
      if (!label) {
        throw new BadRequestException(ErrorTypes.INVALID_LABEL_ID);
      }
    }

    if (createPmpDCEventMeasurementDto.parameterId) {
      parameter = await this.dailycheckOperationParametersRepository.findOne(
        createPmpDCEventMeasurementDto.parameterId,
      );
      if (!parameter) {
        throw new BadRequestException(ErrorTypes.INVALID_PARAMETER_ID);
      }
    }

    let operationType = PmpDCEventLogTypes.updateMeasurement;
    let measurement = await this.pmpDCEventMeasurementsRepository.findOne({
      where: {
        event: { id: eventId },
        operation,
        ...(createPmpDCEventMeasurementDto.parameterId
          ? { parameter: parameter }
          : {}),
      },
    });
    if (!measurement) {
      operationType = PmpDCEventLogTypes.createMeasurement;
      measurement = this.pmpDCEventMeasurementsRepository.create({
        event: { id: eventId },
        operation,
      });
    }

    if (label) measurement.label = label;
    if (parameter) measurement.parameter = parameter;
    if (typeof createPmpDCEventMeasurementDto.feedback !== 'undefined') {
      measurement.feedback = createPmpDCEventMeasurementDto.feedback;
    }
    measurement.parameterValue = createPmpDCEventMeasurementDto.parameterValue;

    if (createPmpDCEventMeasurementDto.fileIds) {
      const files = [];
      for (const fileId of createPmpDCEventMeasurementDto.fileIds) {
        try {
          const file = await this.filesRepository.findOne(fileId);
          if (file) {
            files.push(file);
          }
        } catch (e) {}
      }
      measurement.files = files;
    }

    await this.pmpDCEventMeasurementsRepository.save(measurement);

    if (event.status === PmpDCEventStatus.open) {
      event.status = PmpDCEventStatus.inProgress;
      await this.pmpDCEventsRepository.save(event);

      const logItem = this.pmpDCEventLogItemsRepository.create({
        user: { id: userId },
        operation: {
          type: PmpDCEventLogTypes.changeStatus,
          status: PmpDCEventStatus.inProgress,
        },
        event,
        comment: '',
      });
      this.pmpDCEventLogItemsRepository.save(logItem);
    }

    const logItem = this.pmpDCEventLogItemsRepository.create({
      user: { id: userId },
      operation: {
        type: operationType,
        measurementId: measurement.id,
      },
      event,
      comment: '',
    });
    this.pmpDCEventLogItemsRepository.save(logItem);
    return true;
  }

  async saveEventOperationData(
    eventId: number,
    createPmpDCEventOperationDataDto: CreatePmpDCEventOperationDataDto,
    userId: number,
  ) {
    const event = await this.pmpDCEventsRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new BadRequestException(ErrorTypes.INVALID_EVENT_ID);
    }

    const operation = await this.dailycheckProceduresRepository.findOne(
      createPmpDCEventOperationDataDto.operationId,
    );
    if (!operation) {
      throw new BadRequestException(ErrorTypes.INVALID_OPERATION_ID);
    }

    let operationType = PmpDCEventLogTypes.updateOperationData;
    let operationData = await this.pmpDCEventOperationsDataRepository.findOne({
      where: {
        event: { id: eventId },
        operation,
      },
    });
    if (!operationData) {
      operationType = PmpDCEventLogTypes.createOperationData;
      operationData = this.pmpDCEventOperationsDataRepository.create({
        event: { id: eventId },
        operation,
      });
    }

    if (typeof createPmpDCEventOperationDataDto.feedback !== 'undefined') {
      operationData.feedback = createPmpDCEventOperationDataDto.feedback;
    }

    if (createPmpDCEventOperationDataDto.fileIds) {
      const files = [];
      for (const fileId of createPmpDCEventOperationDataDto.fileIds) {
        try {
          const file = await this.filesRepository.findOne(fileId);
          if (file) {
            files.push(file);
          }
        } catch (e) {}
      }
      operationData.files = files;
    }

    await this.pmpDCEventOperationsDataRepository.save(operationData);

    if (event.status === PmpDCEventStatus.open) {
      event.status = PmpDCEventStatus.inProgress;
      await this.pmpDCEventsRepository.save(event);

      const logItem = this.pmpDCEventLogItemsRepository.create({
        user: { id: userId },
        operation: {
          type: PmpDCEventLogTypes.changeStatus,
          status: PmpDCEventStatus.inProgress,
        },
        event,
        comment: '',
      });
      this.pmpDCEventLogItemsRepository.save(logItem);
    }

    const logItem = this.pmpDCEventLogItemsRepository.create({
      user: { id: userId },
      operation: {
        type: operationType,
        operationId: operationData.id,
      },
      event,
      comment: '',
    });
    this.pmpDCEventLogItemsRepository.save(logItem);
    return true;
  }

  async getEventsByProjectId(projectId: number, start: string) {
    let startDate: dayjs.Dayjs;
    let stopDate: dayjs.Dayjs;

    startDate = dayjs(start).set('hour', 0).set('minute', 0).set('second', 0);
    stopDate = dayjs(start).set('hour', 23).set('minute', 59).set('second', 59);

    const project = await this.projectsRepository.findOne(projectId);
    if (!project) {
      throw new BadRequestException(ErrorTypes.INVALID_PROJECT_ID);
    }

    const events = await this.pmpDCEventsRepository.find({
      withDeleted: true,
      where: {
        project: { id: projectId },
        date: Between(startDate.toDate(), stopDate.toDate()),
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

  async findOne(id: number) {
    const event = await this.pmpDCEventsRepository.findOne({
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
        'files',
      ],
    });

    return event;
  }

  remove(id: number) {
    return `This action removes a #${id} pmpDcEvent`;
  }
}
