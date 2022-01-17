import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateOperationDto {
  @IsString()
  @ApiProperty({
    example: 'standard operation description',
    description: 'standard operation description',
    required: true,
  })
  description: string;

  @IsString()
  @ApiProperty({
    example: 'standard operation type',
    description: 'standard operation type',
    required: true,
  })
  type: string;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'procedure id',
    required: true,
  })
  procedureId: number;
}
