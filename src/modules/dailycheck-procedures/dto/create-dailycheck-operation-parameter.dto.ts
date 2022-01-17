import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateDailycheckOperationParameterDto {
  @IsString()
  @ApiProperty({
    example: 'dailycheck operation parameter name',
    description: 'dailycheck operation parameter name',
    required: true,
  })
  name: string;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'min value',
    required: true,
  })
  minValue: number;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'max value',
    required: true,
  })
  maxValue: number;

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
