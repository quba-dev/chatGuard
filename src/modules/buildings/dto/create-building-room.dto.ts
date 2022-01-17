import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBuildingRoomDto {
  @IsString()
  @ApiProperty({
    example: 'room',
    description: 'room name',
    required: true,
  })
  name: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '1',
    description: 'building level id',
    required: false,
  })
  levelId: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'description',
    description: 'room description',
    required: false,
  })
  description: string;
}
