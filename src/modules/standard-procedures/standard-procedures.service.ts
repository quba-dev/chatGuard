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
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';

@Injectable()
export class StandardProceduresService {
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

  async populateStdProcedures() {
    const providers = await this.organizationsRepository.find({
      where: { type: OrganizationTypes.provider },
    });
    if (!providers) {
      console.log('No provider organizations found');
      return;
    }
    let defaultProvider: any;

    const basePath = 'src/modules/standard-procedures/data/provider-std-procs';

    for (const orgFolder of readdirSync(basePath)) {
      if (lstatSync(`${basePath}/${orgFolder}`).isDirectory()) {
        defaultProvider = await this.organizationsRepository.findOne({
          where: { name: orgFolder, type: OrganizationTypes.provider },
        });

        if (defaultProvider) {
          for (const file of readdirSync(`${basePath}/${orgFolder}`)) {
            const content = readFileSync(
              `${basePath}/${orgFolder}/${file}`,
              'utf-8',
            );
            const stdProcObj = JSON.parse(content);

            const baseProjectCategoryUUID = md5Hash(orgFolder);

            const baseUUID = stdProcObj.base_uuid;
            const category = stdProcObj.category;
            const groupName = stdProcObj.group_name;
            const projectCategoryId = md5Hash(
              baseProjectCategoryUUID + 'projectCategoryId' + category,
            );
            const categoryId = md5Hash(
              baseProjectCategoryUUID + 'categoryId' + category,
            );
            const categoryGroupId = md5Hash(baseUUID + groupName);

            let standardEquipmentProjectCategory =
              await this.standardEquipmentProjectCategoriesRepository.findOne({
                where: { uuid: projectCategoryId },
              });
            if (!standardEquipmentProjectCategory) {
              standardEquipmentProjectCategory =
                new StandardEquipmentProjectCategory();
              standardEquipmentProjectCategory.name = category;
              standardEquipmentProjectCategory.organization = defaultProvider;
              standardEquipmentProjectCategory.uuid = projectCategoryId;
              await this.standardEquipmentProjectCategoriesRepository.save(
                standardEquipmentProjectCategory,
              );
            }

            let standardEquipmentCategory =
              await this.standardEquipmentCategoriesRepository.findOne({
                where: { uuid: categoryId },
              });
            if (!standardEquipmentCategory) {
              standardEquipmentCategory = new StandardEquipmentCategory();
              standardEquipmentCategory.name = category;
              standardEquipmentCategory.organization = defaultProvider;
              standardEquipmentCategory.uuid = categoryId;
              await this.standardEquipmentCategoriesRepository.save(
                standardEquipmentCategory,
              );
            }

            let standardEquipmentCategoryGroup =
              await this.standardEquipmentCategoryGroupsRepository.findOne({
                where: { uuid: categoryGroupId },
              });
            if (!standardEquipmentCategoryGroup) {
              standardEquipmentCategoryGroup =
                new StandardEquipmentCategoryGroup();
              standardEquipmentCategoryGroup.name = groupName;
              standardEquipmentCategoryGroup.category =
                standardEquipmentCategory;
              standardEquipmentCategoryGroup.uuid = categoryGroupId;
              await this.standardEquipmentCategoryGroupsRepository.save(
                standardEquipmentCategoryGroup,
              );
            }

            for (const [
              procedureIndex,
              procedure,
            ] of stdProcObj.procedures.entries()) {
              const procedureId = md5Hash(
                baseUUID + 'procedure' + procedureIndex,
              );

              let procedureDB = await this.standardProceduresRepository.findOne(
                {
                  where: { uuid: procedureId },
                },
              );
              if (!procedureDB) {
                procedureDB = new StandardProcedure();
                procedureDB.uuid = procedureId;
                procedureDB.frequency = procedure.frequency;
                procedureDB.type = procedure.type;
                procedureDB.subType = procedure.subtype;
                procedureDB.categoryGroup = standardEquipmentCategoryGroup;
                await this.standardProceduresRepository.save(procedureDB);
              }

              for (const [
                operationIndex,
                operation,
              ] of procedure.operations.entries()) {
                const operationId = md5Hash(
                  baseUUID + 'operation' + procedureIndex + operationIndex,
                );
                let operationDB =
                  await this.standardOperationsRepository.findOne({
                    where: { uuid: operationId },
                  });
                if (!operationDB) {
                  operationDB = new StandardOperation();
                  operationDB.uuid = operationId;
                  operationDB.description = operation.description;
                  operationDB.type = operation.type;
                  operationDB.procedure = procedureDB;
                  await this.standardOperationsRepository.save(operationDB);
                }

                if (operation.type === 'visual') {
                  for (const [
                    labelIndex,
                    label,
                  ] of operation.labels.entries()) {
                    const labelId = md5Hash(
                      baseUUID +
                        'label' +
                        procedureIndex +
                        operationIndex +
                        labelIndex,
                    );
                    let labelDB =
                      await this.standardOperationLabelsRepository.findOne({
                        where: { uuid: labelId },
                      });
                    if (!labelDB) {
                      labelDB = new StandardOperationLabel();
                      labelDB.uuid = labelId;
                      labelDB.name = label.name;
                      labelDB.generateAlert = label.generate_alert;
                      labelDB.operation = operationDB;
                      await this.standardOperationLabelsRepository.save(
                        labelDB,
                      );
                    }
                  }
                }

                if (operation.type === 'parameter') {
                  for (const [
                    parameterIndex,
                    parameter,
                  ] of operation.parameters.entries()) {
                    const parameterId = md5Hash(
                      baseUUID +
                        'parameter' +
                        procedureIndex +
                        operationIndex +
                        parameterIndex,
                    );
                    let parameterDB =
                      await this.standardOperationParametersRepository.findOne({
                        where: { uuid: parameterId },
                      });
                    if (!parameterDB) {
                      const unit = await this.unitsRepository.findOne({
                        where: { name: parameter.unit },
                      });
                      parameterDB = new StandardOperationParameter();
                      parameterDB.uuid = parameterId;
                      parameterDB.name = parameter.name;
                      parameterDB.unit = unit;
                      parameterDB.operation = operationDB;
                      await this.standardOperationParametersRepository.save(
                        parameterDB,
                      );
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  async createStandardProcedure(
    createStandardProcedureDto: CreateProcedureDto,
  ) {
    const standardCategoryGroup =
      await this.standardEquipmentCategoryGroupsRepository.findOne({
        where: { id: createStandardProcedureDto.categoryGroupId },
      });
    if (!standardCategoryGroup)
      throw new BadRequestException(
        ErrorTypes.STANDARD_CATEGORY_GROUP_NOT_FOUND,
      );

    const standardProcedure = new StandardProcedure();

    standardProcedure.type = createStandardProcedureDto.type;
    standardProcedure.subType = createStandardProcedureDto.subType;
    standardProcedure.frequency = createStandardProcedureDto.frequency;
    standardProcedure.categoryGroup = standardCategoryGroup;

    await this.standardProceduresRepository.save(standardProcedure);

    return standardProcedure;
  }

  async updateStandardProcedure(
    updateStandardProcedureDto: UpdateProcedureDto,
    id: number,
  ) {
    const standardProcedure = await this.standardProceduresRepository.findOne({
      where: { id },
    });
    if (!standardProcedure) return true;

    if (updateStandardProcedureDto.categoryGroupId) {
      const standardCategoryGroup =
        await this.standardEquipmentCategoryGroupsRepository.findOne({
          where: { id: updateStandardProcedureDto.categoryGroupId },
        });
      if (!standardCategoryGroup)
        throw new BadRequestException(
          ErrorTypes.STANDARD_CATEGORY_GROUP_NOT_FOUND,
        );
      standardProcedure.categoryGroup = standardCategoryGroup;
    }
    if (updateStandardProcedureDto.type) {
      standardProcedure.type = updateStandardProcedureDto.type;
    }
    if (updateStandardProcedureDto.subType) {
      standardProcedure.subType = updateStandardProcedureDto.subType;
    }
    if (updateStandardProcedureDto.frequency) {
      standardProcedure.frequency = updateStandardProcedureDto.frequency;
    }

    await this.standardProceduresRepository.save(standardProcedure);

    return true;
  }

  async removeStandardProcedure(id: number) {
    const standardProcedure = await this.standardProceduresRepository.findOne(
      id,
    );
    if (!standardProcedure) return true;

    await this.standardProceduresRepository.remove(standardProcedure);
    return true;
  }
}
