import { PartialType } from '@nestjs/swagger';
import { CreateOperationLabelDto } from './create-operation-label.dto';

export class UpdateOperationLabelDto extends PartialType(
  CreateOperationLabelDto,
) {}
