import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { CreateSubcontractorContactDto } from './create-subcontractorContact.dto';

export class UpdateSubcontractorContactDto extends PartialType(
  CreateSubcontractorContactDto,
) {
  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '1',
    description: 'subcontractor contact id',
    required: false,
  })
  id: number;
}
