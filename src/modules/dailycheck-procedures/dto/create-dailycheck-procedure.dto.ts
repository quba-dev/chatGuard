import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDailycheckProcedureDto {
  @IsString()
  @ApiProperty({
    example: 'dailycheck procedure description',
    description: 'dailycheck procedure description',
    required: true,
  })
  description: string;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'project id',
    required: true,
  })
  projectId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '1',
    description: 'equipment id',
    required: false,
  })
  equipmentId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '1',
    description: 'equipment category group id',
    required: false,
  })
  equipmentCategoryGroupId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '1',
    description: 'dailycheck group id',
    required: false,
  })
  groupId: number;
}
