import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class GetPmpEventsByProjectIdYearlyQueryParams {
  @IsString()
  @ApiProperty({
    example: 'yyyy-mm-dd',
    description: 'event date',
    required: true,
  })
  start: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'test',
    description: 'search string',
    required: false,
  })
  search: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'item:value,item:value',
    description: 'filter string',
    required: false,
  })
  filter: string;
}
