import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateOperationParameterDto {
  @IsString()
  @ApiProperty({
    example: 'standard operation parameter name',
    description: 'standard operation parameter name',
    required: true,
  })
  name: string;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'unit id',
    required: true,
  })
  unitId: number;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'operation id',
    required: true,
  })
  operationId: number;
}
