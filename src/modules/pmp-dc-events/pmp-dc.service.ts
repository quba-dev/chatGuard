import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';

import { Between, ILike, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { DailycheckOperationLabel } from '../dailycheck-procedures/entities/dailycheck-operation-label.entity';
import { DailycheckOperationParameter } from '../dailycheck-procedures/entities/dailycheck-operation-parameter.entity';
import { DailycheckOperation } from '../dailycheck-procedures/entities/dailycheck-operation.entity';
import { DailycheckProcedure } from '../dailycheck-procedures/entities/dailycheck-procedure.entity';
import { Equipment } from '../equipments/entities/equipment.entity';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { Project } from '../projects/entities/project.entity';
import { CreatePmpDcEventDto } from './dto/create-pmp-dc-event.dto';
import { PmpDCEventLogItem } from './entities/pmp-dc-event-log-item.entity';
import { PmpDCEventMeasurement } from './entities/pmp-dc-event-measurement.entity';
import { PmpDCEventOperationData } from './entities/pmp-dc-event-operation-data.entity';
import { PmpDCEvent } from './entities/pmp-dc-event.entity';
import { File } from '../files/entities/file.entity';
import { PmpDC } from './entities/pmp-dc.entity';
import { ProjectStatus } from '../projects/enums/project-status.enum';
import { PmpDcEventsService } from './pmp-dc-events.service';
import { buildIntervalFilter } from '../../util/filter';

@Injectable()
export class PmpDcsService {
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
    private pmpDcEventsService: PmpDcEventsService,
    private config: AppConfig,
  ) {}

  async validateDailyCheck(dailyCheckId: number) {
    const dailyCheck = await this.pmpDCsRepository.findOne(dailyCheckId);
    if (!dailyCheck)
      throw new BadRequestException(ErrorTypes.DAILYCHECK_NOT_FOUND);

    dailyCheck.validated = true;
    await this.pmpDCsRepository.save(dailyCheck);

    return dailyCheck;
  }

  async invalidateDailyCheck(dailyCheckId: number) {
    const dailyCheck = await this.pmpDCsRepository.findOne(dailyCheckId);
    if (!dailyCheck)
      throw new BadRequestException(ErrorTypes.DAILYCHECK_NOT_FOUND);

    dailyCheck.validated = false;
    await this.pmpDCsRepository.save(dailyCheck);

    return dailyCheck;
  }

  async create(projectId: number) {
    const dailyCheck = new PmpDC();
    dailyCheck.date = dayjs().toDate();

    const project = await this.projectsRepository.findOne(projectId);
    if (!projectId) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);
    dailyCheck.project = project;

    return await this.pmpDCsRepository.save(dailyCheck);
  }

  async createDailyCheckForActiveProjects() {
    const activeProjects = await this.projectsRepository.find({
      where: { status: ProjectStatus.active },
    });

    for (const activeProject of activeProjects) {
      await this.createDailyCheckForProject(activeProject.id);
    }

    return true;
  }

  async createDailyCheckForProject(projectId: number) {
    const dailyCheck = await this.create(projectId);
    const dailyCheckProceduresInProject =
      await this.dailycheckProceduresRepository.find({
        where: { project: { id: projectId } },
      });
    for (const dailyCheckProcedure of dailyCheckProceduresInProject) {
      const createPmpDcEventDto: CreatePmpDcEventDto = {
        dailyCheckId: dailyCheck.id,
        dailyCheckProcedureId: dailyCheckProcedure.id,
      };

      await this.pmpDcEventsService.create(createPmpDcEventDto);
    }

    return true;
  }

  async getDailyCheckById(dailyCheckId: number) {
    const dailyCheck = await this.pmpDCsRepository.findOne(dailyCheckId);
    if (!dailyCheck)
      throw new BadRequestException(ErrorTypes.DAILYCHECK_NOT_FOUND);

    return dailyCheck;
  }

  async getDailyChecksByProjectId(
    projectId: number,
    start: string,
    stop: string,
    filter: string,
    search: string,
  ) {
    // FILTER wip
    // const myRegexp = /(created:(?<createdStart>.*?)_(?<createdEnd>.*?),)?/g;
    // // this delimiter is needed at the end of the string
    // filter += ',';
    // const dailyChecksFilterObj = myRegexp.exec(filter).groups;

    let createdIntervalObject = {};
    if (start && stop) {
      [createdIntervalObject] = buildIntervalFilter(start, stop, 'createdAt');
    }

    const searchObject = {};
    if (search) {
      searchObject['subject'] = ILike(`%${search}%`);
    }

    const whereObject = {
      where: {
        project: { id: projectId },
        ...createdIntervalObject,
        ...searchObject,
      },
    };

    const dailyCheckProceduresInProject =
      await this.dailycheckProceduresRepository.find({
        ...whereObject,
      });

    return {
      total: dailyCheckProceduresInProject.length,
      data: dailyCheckProceduresInProject,
    };
  }
}
