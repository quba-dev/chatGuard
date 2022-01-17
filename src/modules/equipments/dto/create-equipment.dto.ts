import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateEquipmentInputDto } from './create-equipment-input.dto';

export class CreateEquipmentDto {
  @IsString()
  @ApiProperty({
    example: 'equipment',
    description: 'equipment name',
    required: true,
  })
  name: string;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'equipment quantity',
    required: true,
  })
  quantity: number;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'equipment standard category group id',
    required: true,
  })
  standardCategoryGroupId: number;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'equipment category group id',
    required: true,
  })
  equipmentCategoryGroupId: number;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'equipment model id',
    required: true,
  })
  equipmentModelId: number;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'equipment manufacturer id',
    required: true,
  })
  manufacturerId: number;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'equipment project id',
    required: true,
  })
  projectId: number;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'equipment building id',
    required: true,
  })
  buildingId: number;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'equipment building level id',
    required: true,
  })
  buildingLevelId: number;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'equipment building room id',
    required: true,
  })
  buildingRoomId: number;

  @IsArray()
  @ApiProperty({
    example: [],
    type: 'array',
    description: 'array of equipment inputs dtos',
    required: true,
  })
  inputs: CreateEquipmentInputDto[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    example: ['uuid1', 'uuid2'],
    description: 'array of file uuids',
    required: false,
  })
  mediaFileIds: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    example: ['uuid1', 'uuid2'],
    description: 'array of file uuids',
    required: false,
  })
  documentationFileIds: string[];
}
