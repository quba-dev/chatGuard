import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateBuildingLevelDto } from './create-building-level.dto';

export class CreateBuildingDto {
  @IsString()
  @ApiProperty({
    example: 'building 1',
    description: 'building name',
    required: true,
  })
  name: string;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'building project id',
    required: true,
  })
  projectId: number;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    example: [],
    type: 'array',
    description: 'array of level dtos',
    required: false,
  })
  levels: CreateBuildingLevelDto[];
}
