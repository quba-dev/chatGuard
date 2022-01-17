import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateProjectCategoryDto {
  @IsString()
  @ApiProperty({
    example: 'name',
    description: 'group name',
    required: true,
  })
  name: string;
}
