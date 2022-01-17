import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { isOptionalChain } from 'typescript';

export class UpdateResolvedDto {
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
    example: 'contact info',
    description: 'ticket contact',
    required: true,
  })
  rating?: number;

  @IsString()
  @ApiProperty({
    example: 'my ticket is not resolved because',
    description: 'reason for given status',
    required: true,
  })
  reason: string;
}
