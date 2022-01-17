import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreatePmpDcEventDto {
  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'dailyCheckProcedureId',
    required: true,
  })
  dailyCheckProcedureId: number;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'dailyCheckId',
    required: true,
  })
  dailyCheckId: number;
}
