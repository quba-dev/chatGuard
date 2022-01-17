import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWorkOrderDto {
  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'work order project',
    required: true,
  })
  projectId: number;

  @IsDateString()
  @ApiProperty({
    example: 'yyyy-mm-dd hh:mm:ss',
    description: 'project start date',
    required: true,
  })
  dueDate: Date;

  @IsString()
  @ApiProperty({
    example: 'subject',
    description: 'work order subject',
    required: true,
  })
  subject: string;

  @IsString()
  @ApiProperty({
    example: 'description',
    description: 'work order description',
    required: true,
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
