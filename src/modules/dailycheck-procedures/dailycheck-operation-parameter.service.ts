import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { Unit } from '../units/entities/unit';
import { CreateDailycheckOperationParameterDto } from './dto/create-dailycheck-operation-parameter.dto';
import { UpdateDailycheckOperationParameterDto } from './dto/update-dailycheck-operation-parameter.dto';
import { DailycheckOperation } from './entities/dailycheck-operation.entity';
import { DailycheckOperationParameter } from './entities/dailycheck-operation-parameter.entity';
import { OperationTypes } from './enums/operationTypes.enum';

@Injectable()
export class DailycheckOperationParametersService {
  constructor(
    @InjectRepository(DailycheckOperation)
    private dailycheckOperationsRepository: Repository<DailycheckOperation>,
    @InjectRepository(DailycheckOperationParameter)
    private dailycheckOperationParametersRepository: Repository<DailycheckOperationParameter>,
    @InjectRepository(Unit)
    private unitsRepository: Repository<Unit>,
    private config: AppConfig,
  ) {}

  async create(
    createDailycheckOperationParameterDto: CreateDailycheckOperationParameterDto,
  ) {
    const dailycheckOperationParameterData: DeepPartial<DailycheckOperationParameter> =
      {
        ...createDailycheckOperationParameterDto,
      };

    if (createDailycheckOperationParameterDto.operationId) {
      const operation = await this.dailycheckOperationsRepository.findOne(
        createDailycheckOperationParameterDto.operationId,
      );
      if (!operation)
        throw new BadRequestException(
          ErrorTypes.DAILYCHECK_OPERATION_NOT_FOUND,
        );
      if (operation.type != OperationTypes.parameter)
        throw new BadRequestException(
          ErrorTypes.YOU_CAN_ADD_PARAMETERS_ONLY_TO_PARAMETER_OPERATION,
        );

      dailycheckOperationParameterData.operation = operation;
    }

    if (createDailycheckOperationParameterDto.unitId) {
      const unit = await this.unitsRepository.findOne(
        createDailycheckOperationParameterDto.unitId,
      );
      if (!unit) throw new BadRequestException(ErrorTypes.UNIT_NOT_FOUND);
      dailycheckOperationParameterData.unit = unit;
    }

    const dailycheckOperationParameter =
      this.dailycheckOperationParametersRepository.create(
        dailycheckOperationParameterData,
      );
    return await this.dailycheckOperationParametersRepository.save(
      dailycheckOperationParameter,
    );
  }

  async update(
    id: number,
    updateDailycheckOperationParameterDto: UpdateDailycheckOperationParameterDto,
  ) {
    const dailycheckOperationParameterData: DeepPartial<DailycheckOperationParameter> =
      {
        ...updateDailycheckOperationParameterDto,
      };

    if (updateDailycheckOperationParameterDto.operationId) {
      const operation = await this.dailycheckOperationsRepository.findOne(
        updateDailycheckOperationParameterDto.operationId,
      );
      if (!operation)
        throw new BadRequestException(
          ErrorTypes.DAILYCHECK_OPERATION_NOT_FOUND,
        );
      if (operation.type != OperationTypes.parameter)
        throw new BadRequestException(
          ErrorTypes.YOU_CAN_ADD_PARAMETERS_ONLY_TO_PARAMETER_OPERATION,
        );

      dailycheckOperationParameterData.operation = operation;
    }
    if (updateDailycheckOperationParameterDto.unitId) {
      const unit = await this.unitsRepository.findOne(
        updateDailycheckOperationParameterDto.unitId,
      );
      if (!unit) throw new BadRequestException(ErrorTypes.UNIT_NOT_FOUND);
      dailycheckOperationParameterData.unit = unit;
    }
    dailycheckOperationParameterData['id'] = id;

    const dailycheckOperationDB =
      await this.dailycheckOperationParametersRepository.preload(
        dailycheckOperationParameterData,
      );
    return await this.dailycheckOperationParametersRepository.save(
      dailycheckOperationDB,
    );
  }

  async remove(id: number) {
    return await this.dailycheckOperationParametersRepository.delete({
      id: id,
    });
  }
}
