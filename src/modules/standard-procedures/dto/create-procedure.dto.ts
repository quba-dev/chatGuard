import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProcedureDto {
  @IsString()
  @ApiProperty({
    example: 'maintenance procedure type',
    description: 'maintenance procedure type',
    required: true,
  })
  type: string;

  @IsString()
  @ApiProperty({
    example: 'maintenance procedure subtype',
    description: 'maintenance procedure subtype',
    required: true,
  })
  subType: string;

  @IsString()
  @ApiProperty({
    example: 'maintenance procedure frequency',
    description: 'maintenance procedure frequency',
    required: true,
  })
  frequency: string;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'standard category group id',
    required: true,
  })
  categoryGroupId: number;
}
