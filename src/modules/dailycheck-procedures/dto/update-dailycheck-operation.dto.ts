import { PartialType } from '@nestjs/swagger';
import { CreateDailycheckOperationDto } from './create-dailycheck-operation.dto';

export class UpdateDailycheckOperationDto extends PartialType(
  CreateDailycheckOperationDto,
) {}
