import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateClosedDto {
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
