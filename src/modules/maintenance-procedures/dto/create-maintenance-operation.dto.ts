import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateMaintenanceOperationDto {
  @IsString()
  @ApiProperty({
    example: 'maintenance operation description',
    description: 'maintenance operation description',
    required: true,
  })
  description: string;

  @IsString()
  @ApiProperty({
    example: 'maintenance operation type',
    description: 'maintenance operation type',
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
