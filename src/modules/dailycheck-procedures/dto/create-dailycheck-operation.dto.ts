import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateDailycheckOperationDto {
  @IsString()
  @ApiProperty({
    example: 'dailycheck operation description',
    description: 'dailycheck operation description',
    required: true,
  })
  description: string;

  @IsString()
  @ApiProperty({
    example: 'dailycheck operation type',
    description: 'dailycheck operation type',
    required: true,
  })
  type: string;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'procedure id',
    required: true,
  })
  procedureId: number;
}
