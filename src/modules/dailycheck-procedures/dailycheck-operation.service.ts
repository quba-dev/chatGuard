import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { CreateDailycheckOperationDto } from './dto/create-dailycheck-operation.dto';
import { UpdateDailycheckOperationDto } from './dto/update-dailycheck-operation.dto';
import { DailycheckOperation } from './entities/dailycheck-operation.entity';
import { DailycheckOperationLabel } from './entities/dailycheck-operation-label.entity';
import { DailycheckOperationParameter } from './entities/dailycheck-operation-parameter.entity';
import { DailycheckProcedure } from './entities/dailycheck-procedure.entity';
import { OperationTypes } from './enums/operationTypes.enum';

@Injectable()
export class DailycheckOperationsService {
  constructor(
    @InjectRepository(DailycheckOperation)
    private dailycheckOperationsRepository: Repository<DailycheckOperation>,
    @InjectRepository(DailycheckOperationLabel)
    private dailycheckOperationLabelsRepository: Repository<DailycheckOperationLabel>,
    @InjectRepository(DailycheckOperationParameter)
    private dailycheckOperationParametersRepository: Repository<DailycheckOperationParameter>,
    @InjectRepository(DailycheckProcedure)
    private dailycheckProceduresRepository: Repository<DailycheckProcedure>,
    private config: AppConfig,
  ) {}

  async create(createDailycheckOperationDto: CreateDailycheckOperationDto) {
    const dailycheckOperationData: DeepPartial<DailycheckOperation> = {
      ...createDailycheckOperationDto,
    };

    if (createDailycheckOperationDto.procedureId) {
      const equipment = await this.dailycheckProceduresRepository.findOne(
        createDailycheckOperationDto.procedureId,
      );
      if (!equipment)
        throw new BadRequestException(
          ErrorTypes.DAILYCHECK_PROCEDURE_NOT_FOUND,
        );

      dailycheckOperationData.procedure = equipment;
    }

    const dailycheckOperation = this.dailycheckOperationsRepository.create(
      dailycheckOperationData,
    );
    return await this.dailycheckOperationsRepository.save(dailycheckOperation);
  }

  async update(
    id: number,
    updateDailycheckOperationDto: UpdateDailycheckOperationDto,
  ) {
    const dailycheckOperationData: DeepPartial<DailycheckOperation> = {
      ...updateDailycheckOperationDto,
    };

    if (updateDailycheckOperationDto.procedureId) {
      const equipment = await this.dailycheckProceduresRepository.findOne(
        updateDailycheckOperationDto.procedureId,
      );
      if (!equipment)
        throw new BadRequestException(
          ErrorTypes.DAILYCHECK_PROCEDURE_NOT_FOUND,
        );
      dailycheckOperationData.procedure = equipment;
    }
    dailycheckOperationData['id'] = id;

    const dailycheckOperationDB =
      await this.dailycheckOperationsRepository.preload(
        dailycheckOperationData,
      );
    await this.dailycheckOperationsRepository.save(dailycheckOperationDB);

    if (dailycheckOperationDB.type === OperationTypes.visual) {
      this.dailycheckOperationParametersRepository.delete({
        operation: { id: dailycheckOperationDB.id },
      });
    }
    if (dailycheckOperationDB.type === OperationTypes.parameter) {
      this.dailycheckOperationLabelsRepository.delete({
        operation: { id: dailycheckOperationDB.id },
      });
    }
    return dailycheckOperationDB;
  }

  async remove(id: number) {
    return await this.dailycheckOperationsRepository.delete({ id: id });
  }
}
