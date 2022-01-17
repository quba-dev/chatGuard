import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateBuildingRoomDto } from './create-building-room.dto';

export class CreateBuildingLevelDto {
  @IsString()
  @ApiProperty({
    example: 'level 1',
    description: 'level name',
    required: true,
  })
  name: string;

  @IsBoolean()
  @ApiProperty({
    example: 'true',
    description: 'is sub level flag',
    required: true,
  })
  isSubLevel: boolean;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '1',
    description: 'building id',
    required: false,
  })
  buildingId: number;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    example: [],
    type: 'array',
    description: 'array of room dtos',
    required: false,
  })
  rooms: CreateBuildingRoomDto[];
}
