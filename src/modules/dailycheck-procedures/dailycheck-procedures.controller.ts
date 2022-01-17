import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { DailycheckProceduresService } from './dailycheck-procedures.service';
import { DailycheckOperationsService } from './dailycheck-operation.service';
import { DailycheckOperationLabelsService } from './dailycheck-operation-label.service';
import { DailycheckOperationParametersService } from './dailycheck-operation-parameter.service';
import { TenantLocationDto } from '../buildings/dto/tenant-location.dto';
import { DailycheckGroupsService } from './dailycheck-groups.service';
import { CreateDailycheckGroupDto } from './dto/create-dailycheck-group.dto';
import { UpdateDailycheckGroupDto } from './dto/update-dailycheck-group.dto';
import { validateBulk } from '../../util/bulk-validator';
import { CreateDailycheckProcedureDto } from './dto/create-dailycheck-procedure.dto';
import { UpdateDailycheckProcedureDto } from './dto/update-dailycheck-procedure.dto';
import { CreateDailycheckOperationDto } from './dto/create-dailycheck-operation.dto';
import { UpdateDailycheckOperationDto } from './dto/update-dailycheck-operation.dto';
import { CreateDailycheckOperationLabelDto } from './dto/create-dailycheck-operation-label.dto';
import { UpdateDailycheckOperationLabelDto } from './dto/update-dailycheck-operation-label.dto';
import { CreateDailycheckOperationParameterDto } from './dto/create-dailycheck-operation-parameter.dto';
import { UpdateDailycheckOperationParameterDto } from './dto/update-dailycheck-operation-parameter.dto';

@Controller('api/dailycheck-procedures')
export class DailycheckProceduresController {
  constructor(
    private readonly dailycheckProceduresService: DailycheckProceduresService,
    private readonly dailycheckOperationsService: DailycheckOperationsService,
    private readonly dailycheckOperationLabelsService: DailycheckOperationLabelsService,
    private readonly dailycheckOperationParametersService: DailycheckOperationParametersService,
    private readonly dailycheckGroupsService: DailycheckGroupsService,
  ) {}

  @Post('/bulk')
  async bulk(@Body() operations: any[]) {
    const result: any[] = [];
    for (const operation of operations) {
      try {
        //dailycheck procedure
        if (operation.type === 'create_dailycheck_procedure') {
          const validationError = await validateBulk(
            new CreateDailycheckProcedureDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.dailycheckProceduresService.create(operation.data);
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'update_dailycheck_procedure') {
          const validationError = await validateBulk(
            new UpdateDailycheckProcedureDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.dailycheckProceduresService.update(
                operation.id,
                operation.data,
              );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'delete_dailycheck_procedure') {
          const intermediateResult =
            await this.dailycheckProceduresService.remove(operation.id);
          result.push(intermediateResult);
        }

        //dailycheck operation
        if (operation.type === 'create_dailycheck_operation') {
          const validationError = await validateBulk(
            new CreateDailycheckOperationDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.dailycheckOperationsService.create(operation.data);
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'update_dailycheck_operation') {
          const validationError = await validateBulk(
            new UpdateDailycheckOperationDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.dailycheckOperationsService.update(
                operation.id,
                operation.data,
              );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'delete_dailycheck_operation') {
          const intermediateResult =
            await this.dailycheckOperationsService.remove(operation.id);
          result.push(intermediateResult);
        }

        //dailycheck operation label
        if (operation.type === 'create_dailycheck_operation_label') {
          const validationError = await validateBulk(
            new CreateDailycheckOperationLabelDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.dailycheckOperationLabelsService.create(
                operation.data,
              );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'update_dailycheck_operation_label') {
          const validationError = await validateBulk(
            new UpdateDailycheckOperationLabelDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.dailycheckOperationLabelsService.update(
                operation.id,
                operation.data,
              );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'delete_dailycheck_operation_label') {
          const intermediateResult =
            await this.dailycheckOperationLabelsService.remove(operation.id);
          result.push(intermediateResult);
        }

        //dailycheck operation parameter
        if (operation.type === 'create_dailycheck_operation_parameter') {
          const validationError = await validateBulk(
            new CreateDailycheckOperationParameterDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.dailycheckOperationParametersService.create(
                operation.data,
              );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'update_dailycheck_operation_parameter') {
          const validationError = await validateBulk(
            new UpdateDailycheckOperationParameterDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.dailycheckOperationParametersService.update(
                operation.id,
                operation.data,
              );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'delete_dailycheck_operation_parameter') {
          const intermediateResult =
            await this.dailycheckOperationParametersService.remove(
              operation.id,
            );
          result.push(intermediateResult);
        }
      } catch (e) {
        result.push({
          isError: true,
          status: e.status,
          message: e.message,
        });
      }
    }
    return result;
  }

  @Get('/by-project-id/:projectId')
  getAllDailychecksInProject(@Param('projectId') projectId: number) {
    return this.dailycheckProceduresService.getAllDailychecksInProject(
      projectId,
    );
  }

  @Get('/group/by-project-id/:projectId')
  getAllDailycheckGroupsInProject(@Param('projectId') projectId: number) {
    return this.dailycheckGroupsService.getAllDailycheckGroupsInProject(
      projectId,
    );
  }

  @Post('/group')
  async createDailycheckGroup(
    @Body() dailycheckGroupDto: CreateDailycheckGroupDto,
  ) {
    return this.dailycheckGroupsService.createDailycheckGroup(
      dailycheckGroupDto,
    );
  }

  @Patch('/group/:id')
  async updateDailycheckGroup(
    @Body() dailycheckGroupDto: UpdateDailycheckGroupDto,
    @Param('id') id: string,
  ) {
    return this.dailycheckGroupsService.updateDailycheckGroup(
      dailycheckGroupDto,
      +id,
    );
  }

  @Delete('/group/:id')
  async removeDailycheckGroup(@Param('id') id: string) {
    return this.dailycheckGroupsService.removeDailycheckGroup(+id);
  }
}
