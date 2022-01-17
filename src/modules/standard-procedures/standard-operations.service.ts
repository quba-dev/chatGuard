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
import { CreateOperationDto } from './dto/create-operation.dto';
import { UpdateOperationDto } from './dto/update-operation.dto';
import { ErrorTypes } from '../error/enums/errorTypes.enum';

@Injectable()
export class StandardOperationsService {
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

  async createStandardOperation(
    createStandardOperationDto: CreateOperationDto,
  ) {
    const standardProcedure = await this.standardProceduresRepository.findOne({
      where: { id: createStandardOperationDto.procedureId },
    });
    if (!standardProcedure)
      throw new BadRequestException(ErrorTypes.STANDARD_PROCEDURE_NOT_FOUND);

    const standardOperation = new StandardOperation();

    standardOperation.type = createStandardOperationDto.type;
    standardOperation.description = createStandardOperationDto.description;
    standardOperation.procedure = standardProcedure;

    await this.standardOperationsRepository.save(standardOperation);

    return standardOperation;
  }

  async updateStandardOperation(
    updateStandardOperationDto: UpdateOperationDto,
    id: number,
  ) {
    const standardOperation = await this.standardOperationsRepository.findOne({
      where: { id },
    });
    if (!standardOperation) return true;

    if (updateStandardOperationDto.procedureId) {
      const standardProcedure = await this.standardProceduresRepository.findOne(
        {
          where: { id: updateStandardOperationDto.procedureId },
        },
      );
      if (!standardProcedure)
        throw new BadRequestException(ErrorTypes.STANDARD_PROCEDURE_NOT_FOUND);
      standardOperation.procedure = standardProcedure;
    }
    if (updateStandardOperationDto.type) {
      standardOperation.type = updateStandardOperationDto.type;
    }
    if (updateStandardOperationDto.description) {
      standardOperation.description = updateStandardOperationDto.description;
    }

    await this.standardOperationsRepository.save(standardOperation);

    return true;
  }

  async removeStandardOperation(id: number) {
    const standardOperation = await this.standardOperationsRepository.findOne(
      id,
    );
    if (!standardOperation) return true;

    await this.standardOperationsRepository.remove(standardOperation);
    return true;
  }
}
