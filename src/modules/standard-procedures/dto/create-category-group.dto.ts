import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateCategoryGroupDto {
  @IsString()
  @ApiProperty({
    example: 'name',
    description: 'group name',
    required: true,
  })
  name: string;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'standard category id',
    required: true,
  })
  categoryId: number;
}
