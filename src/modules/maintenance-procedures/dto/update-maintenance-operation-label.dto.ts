import { PartialType } from '@nestjs/swagger';
import { CreateMaintenanceOperationLabelDto } from './create-maintenance-operation-label.dto';

export class UpdateMaintenanceOperationLabelDto extends PartialType(
  CreateMaintenanceOperationLabelDto,
) {}
