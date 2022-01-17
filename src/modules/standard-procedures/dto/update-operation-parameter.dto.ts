import { PartialType } from '@nestjs/swagger';
import { CreateOperationParameterDto } from './create-operation-parameter.dto';

export class UpdateOperationParameterDto extends PartialType(
  CreateOperationParameterDto,
) {}
