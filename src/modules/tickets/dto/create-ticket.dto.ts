import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { isOptionalChain } from 'typescript';

export class CreateTicketDto {
  @IsString()
  @ApiProperty({
    example: 'subject',
    description: 'ticket subject',
    required: true,
  })
  subject: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'contact info',
    description: 'ticket contact',
    required: false,
  })
  contact?: string;

  //initial message
  @IsString()
  @ApiProperty({
    example: 'description',
    description: 'ticket description',
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

  //ticket info
  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'ticket project id',
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

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
    description: 'ticket building id',
    required: false,
  })
  buildingId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
    description: 'ticket building level id',
    required: false,
  })
  buildingLevelId: number;

  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiProperty({
    example: [1, 2],
    description: 'ticket building room id',
    required: false,
  })
  buildingRoomIds: number[];
}
