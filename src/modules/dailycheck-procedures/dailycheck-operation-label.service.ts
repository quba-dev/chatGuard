import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { CreateDailycheckOperationLabelDto } from './dto/create-dailycheck-operation-label.dto';
import { UpdateDailycheckOperationLabelDto } from './dto/update-dailycheck-operation-label.dto';
import { DailycheckOperation } from './entities/dailycheck-operation.entity';
import { DailycheckOperationLabel } from './entities/dailycheck-operation-label.entity';
import { OperationTypes } from './enums/operationTypes.enum';

@Injectable()
export class DailycheckOperationLabelsService {
  constructor(
    @InjectRepository(DailycheckOperation)
    private dailycheckOperationsRepository: Repository<DailycheckOperation>,
    @InjectRepository(DailycheckOperationLabel)
    private dailycheckOperationLabelsRepository: Repository<DailycheckOperationLabel>,
    private config: AppConfig,
  ) {}

  async create(
    createDailycheckOperationLabelDto: CreateDailycheckOperationLabelDto,
  ) {
    const dailycheckOperationLabelData: DeepPartial<DailycheckOperationLabel> =
      {
        ...createDailycheckOperationLabelDto,
      };

    if (createDailycheckOperationLabelDto.operationId) {
      const operation = await this.dailycheckOperationsRepository.findOne(
        createDailycheckOperationLabelDto.operationId,
      );
      if (!operation)
        throw new BadRequestException(
          ErrorTypes.DAILYCHECK_OPERATION_NOT_FOUND,
        );
      if (operation.type != OperationTypes.visual)
        throw new BadRequestException(
          ErrorTypes.YOU_CAN_ADD_LABELS_ONLY_TO_VISUAL_OPERATION,
        );
      dailycheckOperationLabelData.operation = operation;
    }

    const dailycheckOperationLabel =
      this.dailycheckOperationLabelsRepository.create(
        dailycheckOperationLabelData,
      );
    return await this.dailycheckOperationLabelsRepository.save(
      dailycheckOperationLabel,
    );
  }

  async update(
    id: number,
    updateDailycheckOperationLabelDto: UpdateDailycheckOperationLabelDto,
  ) {
    const dailycheckOperationLabelData: DeepPartial<DailycheckOperationLabel> =
      {
        ...updateDailycheckOperationLabelDto,
      };

    if (updateDailycheckOperationLabelDto.operationId) {
      const operation = await this.dailycheckOperationsRepository.findOne(
        updateDailycheckOperationLabelDto.operationId,
      );
      if (!operation)
        throw new BadRequestException(
          ErrorTypes.DAILYCHECK_OPERATION_NOT_FOUND,
        );
      if (operation.type != OperationTypes.visual)
        throw new BadRequestException(
          ErrorTypes.YOU_CAN_ADD_LABELS_ONLY_TO_VISUAL_OPERATION,
        );
      dailycheckOperationLabelData.operation = operation;
    }
    dailycheckOperationLabelData['id'] = id;

    const dailycheckOperationDB =
      await this.dailycheckOperationLabelsRepository.preload(
        dailycheckOperationLabelData,
      );
    return await this.dailycheckOperationLabelsRepository.save(
      dailycheckOperationDB,
    );
  }

  async remove(id: number) {
    return await this.dailycheckOperationLabelsRepository.delete({ id: id });
  }
}
