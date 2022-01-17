import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TicketPriority } from '../enum/ticket-priority.enum';
import { TicketStatus } from '../enum/ticket-status.enum';
import { CreateTicketDto } from './create-ticket.dto';

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'reason',
    description: 'status change reason',
    required: false,
  })
  reason: string;

  @IsEnum(TicketStatus)
  @IsOptional()
  @ApiProperty({
    example: TicketStatus.new,
    enum: TicketStatus,
    description: 'ticket status',
    required: false,
  })
  status: TicketStatus;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'contact info',
    description: 'ticket contact',
    required: false,
  })
  contact?: string;

  @IsEnum(TicketPriority)
  @IsOptional()
  @ApiProperty({
    example: TicketPriority.low,
    enum: TicketPriority,
    description: 'ticket priority',
    required: false,
  })
  priority: TicketPriority;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    example: 'yyyy-mm-dd hh:mm:ss',
    description: 'project start date',
    required: false,
  })
  dueDate: Date;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'subject',
    description: 'ticket subject',
    required: false,
  })
  subject: string;

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
