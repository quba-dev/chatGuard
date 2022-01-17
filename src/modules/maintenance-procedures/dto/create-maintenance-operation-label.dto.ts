import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateMaintenanceOperationLabelDto {
  @IsString()
  @ApiProperty({
    example: 'maintenance operation label name',
    description: 'maintenance operation label name',
    required: true,
  })
  name: string;

  @IsBoolean()
  @ApiProperty({
    example: true,
    description: 'generate alert',
    required: true,
  })
  generateAlert: boolean;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'operation id',
    required: true,
  })
  operationId: number;
}
