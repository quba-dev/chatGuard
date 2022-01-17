import { PartialType } from '@nestjs/swagger';
import { CreateDailycheckOperationParameterDto } from './create-dailycheck-operation-parameter.dto';

export class UpdateDailycheckOperationParameterDto extends PartialType(
  CreateDailycheckOperationParameterDto,
) {}
