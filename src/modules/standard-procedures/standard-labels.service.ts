import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { lstatSync, readdirSync, readFileSync } from 'fs';
import { md5Hash } from '../../util/util';
import { In, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { Organization } from '../organizations/entities/organization.entity';
import { OrganizationTypes } from '../organizations/enums/organization-types.enum';
import { User } from '../users/entities/user.entity';
import { StandardEquipmentCategory } from './entities/standard-equipment-category';
import { StandardEquipmentCategoryGroup } from './entities/standard-equipment-category-group';
import { StandardEquipmentProjectCategory } from './entities/standard-equipment-project-category';
import { StandardOperation } from './entities/standard-operation';
import { StandardOperationLabel } from './entities/standard-operation-label';
import { StandardOperationParameter } from './entities/standard-operation-parameter';
import { StandardProcedure } from './entities/standard-procedure';
import { Unit } from '../units/entities/unit';
import { CreateOperationLabelDto } from './dto/create-operation-label.dto';
import { UpdateOperationLabelDto } from './dto/update-operation-label.dto';
import { ErrorTypes } from '../error/enums/errorTypes.enum';

@Injectable()
export class StandardLabelsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(StandardEquipmentProjectCategory)
    private standardEquipmentProjectCategoriesRepository: Repository<StandardEquipmentProjectCategory>,
    @InjectRepository(StandardEquipmentCategoryGroup)
    private standardEquipmentCategoryGroupsRepository: Repository<StandardEquipmentCategoryGroup>,
    @InjectRepository(StandardEquipmentCategory)
    private standardEquipmentCategoriesRepository: Repository<StandardEquipmentCategory>,
    @InjectRepository(StandardProcedure)
    private standardProceduresRepository: Repository<StandardProcedure>,
    @InjectRepository(StandardOperation)
    private standardOperationsRepository: Repository<StandardOperation>,
    @InjectRepository(StandardOperationLabel)
    private standardOperationLabelsRepository: Repository<StandardOperationLabel>,
    @InjectRepository(StandardOperationParameter)
    private standardOperationParametersRepository: Repository<StandardOperationParameter>,
    @InjectRepository(Unit)
    private unitsRepository: Repository<Unit>,
    private config: AppConfig,
  ) {}

  async createStandardOperationLabel(
    createStandardOperationLabelDto: CreateOperationLabelDto,
  ) {
    const standardOperation = await this.standardOperationsRepository.findOne({
      where: { id: createStandardOperationLabelDto.operationId },
    });
    if (!standardOperation)
      throw new BadRequestException(ErrorTypes.STANDARD_OPERATION_NOT_FOUND);

    const standardOperationLabel = new StandardOperationLabel();

    standardOperationLabel.name = createStandardOperationLabelDto.name;
    standardOperationLabel.generateAlert =
      createStandardOperationLabelDto.generateAlert;
    standardOperationLabel.operation = standardOperation;

    await this.standardOperationLabelsRepository.save(standardOperationLabel);

    return standardOperationLabel;
  }

  async updateStandardOperationLabel(
    updateStandardOperationLabelDto: UpdateOperationLabelDto,
    id: number,
  ) {
    const standardOperationLabel =
      await this.standardOperationLabelsRepository.findOne({
        where: { id },
      });
    if (!standardOperationLabel) return true;

    if (updateStandardOperationLabelDto.operationId) {
      const standardOperation = await this.standardOperationsRepository.findOne(
        {
          where: { id: updateStandardOperationLabelDto.operationId },
        },
      );
      if (!standardOperation)
        throw new BadRequestException(ErrorTypes.STANDARD_PROCEDURE_NOT_FOUND);
      standardOperationLabel.operation = standardOperation;
    }
    if (updateStandardOperationLabelDto.name) {
      standardOperationLabel.name = updateStandardOperationLabelDto.name;
    }
    if (updateStandardOperationLabelDto.generateAlert) {
      standardOperationLabel.generateAlert =
        updateStandardOperationLabelDto.generateAlert;
    }

    await this.standardOperationLabelsRepository.save(standardOperationLabel);

    return true;
  }

  async removeStandardOperationLabel(id: number) {
    const standardOperationLabel =
      await this.standardOperationLabelsRepository.findOne(id);
    if (!standardOperationLabel) return true;

    await this.standardOperationLabelsRepository.remove(standardOperationLabel);
    return true;
  }
}
