import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { WorkOrderStatus } from '../enum/work-order-status.enum';

export class UpdateWorkOrderDto {
  @IsEnum(WorkOrderStatus)
  @IsOptional()
  @ApiProperty({
    example: WorkOrderStatus.new,
    enum: WorkOrderStatus,
    description: 'work order status',
    required: false,
  })
  status: WorkOrderStatus;

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
    description: 'work order subject',
    required: false,
  })
  subject: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'description',
    description: 'work order description',
    required: false,
  })
  description: string;

  //location
  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
    description: 'work order building id',
    required: false,
  })
  buildingId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
    description: 'work order building level id',
    required: false,
  })
  buildingLevelId: number;

  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiProperty({
    example: 1,
    description: 'work order building room id',
    required: false,
  })
  buildingRoomIds: number[];

  //links
  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiProperty({
    example: [1, 2],
    description: 'work order procurement ids',
    required: false,
  })
  procurementOrderIds: number[];

  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiProperty({
    example: [1, 2],
    description: 'work order ticket ids',
    required: false,
  })
  ticketIds: number[];

  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiProperty({
    example: [1, 2],
    description: 'work order equipment ids',
    required: false,
  })
  equipmentIds: number[];

  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiProperty({
    example: [1, 2],
    description: 'work order user ids',
    required: false,
  })
  userIds: number[];
}
