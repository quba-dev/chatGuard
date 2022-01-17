import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMaintenanceProcedureDto {
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
    description: 'equipment id',
    required: true,
  })
  equipmentId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '1',
    description: 'subcontractor id',
    required: false,
  })
  subcontractorId: number;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    example: 'yyyy-mm-dd',
    description: 'procedure start date',
    required: false,
  })
  startDate: Date;
}
