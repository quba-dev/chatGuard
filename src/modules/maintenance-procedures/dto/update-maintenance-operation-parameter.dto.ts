import { PartialType } from '@nestjs/swagger';
import { CreateMaintenanceOperationParameterDto } from './create-maintenance-operation-parameter.dto';

export class UpdateMaintenanceOperationParameterDto extends PartialType(
  CreateMaintenanceOperationParameterDto,
) {}
