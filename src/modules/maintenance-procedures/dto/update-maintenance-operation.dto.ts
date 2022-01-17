import { PartialType } from '@nestjs/swagger';
import { CreateMaintenanceOperationDto } from './create-maintenance-operation.dto';

export class UpdateMaintenanceOperationDto extends PartialType(
  CreateMaintenanceOperationDto,
) {}
