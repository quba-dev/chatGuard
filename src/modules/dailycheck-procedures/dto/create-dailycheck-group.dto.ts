import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDailycheckGroupDto {
  @IsString()
  @ApiProperty({
    example: 'name',
    description: 'group name',
    required: true,
  })
  name: string;

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
    description: 'building id',
    required: false,
  })
  buildingId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '1',
    description: 'building level id',
    required: false,
  })
  buildingLevelId: number;

  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiProperty({
    example: [1, 2],
    description: 'building room id',
    required: false,
  })
  buildingRoomIds: number[];
}
