import { PartialType } from '@nestjs/swagger';
import { CreateMaintenanceProcedureDto } from './create-maintenance-procedure.dto';

export class UpdateMaintenanceProcedureDto extends PartialType(
  CreateMaintenanceProcedureDto,
) {}
