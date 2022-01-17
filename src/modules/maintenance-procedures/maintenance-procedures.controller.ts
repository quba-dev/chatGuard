import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MaintenanceProceduresService } from './maintenance-procedures.service';
import { MaintenanceOperationsService } from './maintenance-operation.service';
import { MaintenanceOperationLabelsService } from './maintenance-operation-label.service';
import { MaintenanceOperationParametersService } from './maintenance-operation-parameter.service';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateMaintenanceProcedureDto } from './dto/create-maintenance-procedure.dto';
import { validateBulk } from '../../util/bulk-validator';
import { UpdateMaintenanceProcedureDto } from './dto/update-maintenance-procedure.dto';
import { CreateMaintenanceOperationDto } from './dto/create-maintenance-operation.dto';
import { UpdateMaintenanceOperationDto } from './dto/update-maintenance-operation.dto';
import { CreateMaintenanceOperationLabelDto } from './dto/create-maintenance-operation-label.dto';
import { UpdateMaintenanceOperationLabelDto } from './dto/update-maintenance-operation-label.dto';
import { CreateMaintenanceOperationParameterDto } from './dto/create-maintenance-operation-parameter.dto';
import { UpdateMaintenanceOperationParameterDto } from './dto/update-maintenance-operation-parameter.dto';

@Controller('api/maintenance-procedures')
@ApiTags('api/maintenance-procedures')
export class MaintenanceProceduresController {
  constructor(
    private readonly maintenanceProceduresService: MaintenanceProceduresService,
    private readonly maintenanceOperationsService: MaintenanceOperationsService,
    private readonly maintenanceOperationLabelsService: MaintenanceOperationLabelsService,
    private readonly maintenanceOperationParametersService: MaintenanceOperationParametersService,
  ) {}

  @Post('/bulk')
  async bulk(@Body() operations: any[]) {
    const result: any[] = [];
    for (const operation of operations) {
      try {
        //maintenance procedure
        if (operation.type === 'create_maintenance_procedure') {
          const validationError = await validateBulk(
            new CreateMaintenanceProcedureDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.maintenanceProceduresService.create(operation.data);
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'update_maintenance_procedure') {
          const validationError = await validateBulk(
            new UpdateMaintenanceProcedureDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.maintenanceProceduresService.update(
                operation.id,
                operation.data,
              );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'delete_maintenance_procedure') {
          const intermediateResult =
            await this.maintenanceProceduresService.remove(operation.id);
          result.push(intermediateResult);
        }

        //maintenance operation
        if (operation.type === 'create_maintenance_operation') {
          const validationError = await validateBulk(
            new CreateMaintenanceOperationDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.maintenanceOperationsService.create(operation.data);
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'update_maintenance_operation') {
          const validationError = await validateBulk(
            new UpdateMaintenanceOperationDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.maintenanceOperationsService.update(
                operation.id,
                operation.data,
              );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'delete_maintenance_operation') {
          const intermediateResult =
            await this.maintenanceOperationsService.remove(operation.id);
          result.push(intermediateResult);
        }

        //maintenance operation label
        if (operation.type === 'create_maintenance_operation_label') {
          const validationError = await validateBulk(
            new CreateMaintenanceOperationLabelDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.maintenanceOperationLabelsService.create(
                operation.data,
              );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'update_maintenance_operation_label') {
          const validationError = await validateBulk(
            new UpdateMaintenanceOperationLabelDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.maintenanceOperationLabelsService.update(
                operation.id,
                operation.data,
              );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'delete_maintenance_operation_label') {
          const intermediateResult =
            await this.maintenanceOperationLabelsService.remove(operation.id);
          result.push(intermediateResult);
        }

        //maintenance operation parameter
        if (operation.type === 'create_maintenance_operation_parameter') {
          const validationError = await validateBulk(
            new CreateMaintenanceOperationParameterDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.maintenanceOperationParametersService.create(
                operation.data,
              );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'update_maintenance_operation_parameter') {
          const validationError = await validateBulk(
            new UpdateMaintenanceOperationParameterDto(),
            operation.data,
          );
          if (validationError) {
            result.push(validationError);
          } else {
            const intermediateResult =
              await this.maintenanceOperationParametersService.update(
                operation.id,
                operation.data,
              );
            result.push(intermediateResult);
          }
        }
        if (operation.type === 'delete_maintenance_operation_parameter') {
          const intermediateResult =
            await this.maintenanceOperationParametersService.remove(
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

  @Get('/by-equipment-id/:equipmentId')
  @UseGuards(JwtAuthGuard)
  getStandardEquipmentCategories(@Param('equipmentId') equipmentId: number) {
    return this.maintenanceProceduresService.getMaintenanceProceduresByEquipmentId(
      equipmentId,
    );
  }
}
