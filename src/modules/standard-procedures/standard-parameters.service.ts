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
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { CreateOperationParameterDto } from './dto/create-operation-parameter.dto';
import { UpdateOperationParameterDto } from './dto/update-operation-parameter.dto';

@Injectable()
export class StandardParametersService {
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

  async createStandardOperationParameter(
    createStandardOperationParameterDto: CreateOperationParameterDto,
  ) {
    const standardOperation = await this.standardOperationsRepository.findOne({
      where: { id: createStandardOperationParameterDto.operationId },
    });
    if (!standardOperation)
      throw new BadRequestException(ErrorTypes.STANDARD_OPERATION_NOT_FOUND);

    const unit = await this.unitsRepository.findOne({
      where: { id: createStandardOperationParameterDto.unitId },
    });
    if (!unit) throw new BadRequestException(ErrorTypes.UNIT_NOT_FOUND);

    const standardOperationParameter = new StandardOperationParameter();

    standardOperationParameter.name = createStandardOperationParameterDto.name;
    standardOperationParameter.unit = unit;
    standardOperationParameter.operation = standardOperation;

    await this.standardOperationParametersRepository.save(
      standardOperationParameter,
    );

    return standardOperationParameter;
  }

  async updateStandardOperationParameter(
    updateStandardOperationParameterDto: UpdateOperationParameterDto,
    id: number,
  ) {
    const standardOperationParameter =
      await this.standardOperationParametersRepository.findOne({
        where: { id },
      });
    if (!standardOperationParameter) return true;

    if (updateStandardOperationParameterDto.operationId) {
      const standardOperation = await this.standardOperationsRepository.findOne(
        {
          where: { id: updateStandardOperationParameterDto.operationId },
        },
      );
      if (!standardOperation)
        throw new BadRequestException(ErrorTypes.STANDARD_PROCEDURE_NOT_FOUND);
      standardOperationParameter.operation = standardOperation;
    }

    if (updateStandardOperationParameterDto.unitId) {
      const unit = await this.unitsRepository.findOne({
        where: { id: updateStandardOperationParameterDto.unitId },
      });
      if (!unit) throw new BadRequestException(ErrorTypes.UNIT_NOT_FOUND);
      standardOperationParameter.unit = unit;
    }

    if (updateStandardOperationParameterDto.name) {
      standardOperationParameter.name =
        updateStandardOperationParameterDto.name;
    }

    await this.standardOperationParametersRepository.save(
      standardOperationParameter,
    );

    return true;
  }

  async removeStandardOperationParameter(id: number) {
    const standardOperationParameter =
      await this.standardOperationParametersRepository.findOne(id);
    if (!standardOperationParameter) return true;

    await this.standardOperationParametersRepository.remove(
      standardOperationParameter,
    );
    return true;
  }
}
