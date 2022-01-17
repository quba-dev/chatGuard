import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class RemoveUserFromProjectDto {
  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'user id',
    required: true,
  })
  userId: number;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'project id',
    required: true,
  })
  projectId: number;
}
