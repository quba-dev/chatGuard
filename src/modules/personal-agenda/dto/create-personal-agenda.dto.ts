import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreatePersonalAgendaDto {
  @IsDateString()
  @IsOptional()
  @ApiProperty({
    example: 'yyyy-mm-dd',
    description: 'TODO start date',
    required: false,
  })
  timestamp_start: Date;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    example: 'yyyy-mm-dd',
    description: 'TODO end date',
    required: false,
  })
  timestamp_end: Date;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    example: 'yyyy-mm-dd',
    description: 'TODO reminder',
    required: false,
  })
  timestamp_reminder: Date;

  @IsString()
  @ApiProperty({
    example: 'do this',
    description: 'a title for the TODO',
    required: true,
  })
  title: string;

  @IsString()
  @ApiProperty({
    example: 'do this',
    description: 'a body for the TODO',
    required: true,
  })
  body: string;
}
