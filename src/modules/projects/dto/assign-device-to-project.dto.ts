import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class AssignDeviceToProjectDto {
  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'project id',
    required: true,
  })
  projectId: number;
}
