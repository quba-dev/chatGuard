import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PmpEventStatus } from '../enums/pmp-event-status';

export class CreatePmpEventDto {
  @IsEnum(PmpEventStatus)
  @IsOptional()
  @ApiProperty({
    example: PmpEventStatus.planned,
    description: 'status',
    required: false,
  })
  status: PmpEventStatus;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'something',
    description: 'comments for state change',
    required: false,
  })
  comment: string;

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    example: ['uuid1', 'uuid2'],
    description: 'array of comment file uuids',
    required: false,
  })
  commentFileIds: string[];

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    example: 'yyyy-mm-dd',
    description: 'event date',
    required: false,
  })
  date: Date;

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    example: ['uuid1', 'uuid2'],
    description: 'array of file uuids',
    required: false,
  })
  fileIds: string[];
}
