import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class TenantLocationDto {
  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'building id',
    required: true,
  })
  buildingId: number;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'building level id',
    required: true,
  })
  buildingLevelId: number;

  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiProperty({
    example: [1, 2],
    description: 'building room ids',
    required: false,
  })
  buildingRoomIds: number[];

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'project id',
    required: true,
  })
  projectId: number;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'organization id',
    required: true,
  })
  organizationId: number;
}
