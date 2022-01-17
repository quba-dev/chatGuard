import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateWorkFinishedDto {
  @IsBoolean()
  @ApiProperty({
    example: 'true',
    description: 'true if ticket is resolved',
    required: true,
  })
  resolved!: boolean;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 3,
    description: 'rating',
    required: true,
  })
  rating?: number;

  @IsString()
  @ApiProperty({
    example: 'procurement is ok / or not',
    description: 'reason for given status',
    required: true,
  })
  reason: string;
}
