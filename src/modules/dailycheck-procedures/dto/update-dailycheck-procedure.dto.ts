import { PartialType } from '@nestjs/swagger';
import { CreateDailycheckProcedureDto } from './create-dailycheck-procedure.dto';

export class UpdateDailycheckProcedureDto extends PartialType(
  CreateDailycheckProcedureDto,
) {}
