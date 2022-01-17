import { PartialType } from '@nestjs/swagger';
import { CreateDailycheckOperationLabelDto } from './create-dailycheck-operation-label.dto';

export class UpdateDailycheckOperationLabelDto extends PartialType(
  CreateDailycheckOperationLabelDto,
) {}
