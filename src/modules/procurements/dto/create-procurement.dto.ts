import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { isOptionalChain } from 'typescript';

export class CreateProcurementDto {
  @IsString()
  @ApiProperty({
    example: 'subject',
    description: 'procurement subject',
    required: true,
  })
  subject: string;

  //initial message
  @IsString()
  @ApiProperty({
    example: 'description',
    description: 'procurement description',
    required: true,
  })
  description: string;

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    example: ['uuid1', 'uuid2'],
    description: 'array of file uuids',
    required: false,
  })
  fileIds: string[];

  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiProperty({
    example: [1, 2],
    description: 'other participants to add',
    required: false,
  })
  participantIds: number[];

  //procurement info
  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'procurement project id',
    required: true,
  })
  projectId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
    description: 'recipient id',
    required: false,
  })
  recipientId: number;

  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiProperty({
    example: [1, 2, 3],
    description: 'equipment ids',
    required: false,
  })
  equipmentIds: number[];

  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiProperty({
    example: [1, 2, 3],
    description: 'ticket ids',
    required: false,
  })
  ticketIds: number[];
}
