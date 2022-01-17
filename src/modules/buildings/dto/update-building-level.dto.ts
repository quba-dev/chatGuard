import { PartialType } from '@nestjs/swagger';
import { CreateBuildingLevelDto } from './create-building-level.dto';

export class UpdateBuildingLevelDto extends PartialType(
  CreateBuildingLevelDto,
) {}
