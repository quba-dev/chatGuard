import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @ApiProperty({
    example: 'name',
    description: 'group name',
    required: true,
  })
  name: string;
}
