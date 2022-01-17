import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetPmpDcEventsByProjectIdQueryParams {
  @IsString()
  @ApiProperty({
    example: 'yyyy-mm-dd',
    description: 'event date',
    required: true,
  })
  start: string;

  @IsString()
  @ApiProperty({
    example: 'yyyy-mm-dd',
    description: 'event date',
    required: true,
  })
  stop: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'item:value,item:value',
    description: 'filter string',
    required: false,
  })
  filter: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'item:value,item:value',
    description: 'search string',
    required: false,
  })
  search: string;
}
