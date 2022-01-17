import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateDailycheckOperationLabelDto {
  @IsString()
  @ApiProperty({
    example: 'dailycheck operation label name',
    description: 'dailycheck operation label name',
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
