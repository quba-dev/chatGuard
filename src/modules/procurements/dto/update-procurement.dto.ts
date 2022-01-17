import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProcurementStatus } from '../enum/procurement-status.enum';
import { CreateProcurementDto } from './create-procurement.dto';

export class UpdateProcurementDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'reason',
    description: 'status change reason',
    required: false,
  })
  reason: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 3,
    description: 'proposal rating',
    required: true,
  })
  rating?: number;

  @IsEnum(ProcurementStatus)
  @IsOptional()
  @ApiProperty({
    example: ProcurementStatus.new,
    enum: ProcurementStatus,
    description: 'procurement status',
    required: false,
  })
  status: ProcurementStatus;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    example: 'yyyy-mm-dd hh:mm:ss',
    description: 'procurement due date',
    required: false,
  })
  dueDate: Date;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'subject',
    description: 'procurement subject',
    required: false,
  })
  subject: string;

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
