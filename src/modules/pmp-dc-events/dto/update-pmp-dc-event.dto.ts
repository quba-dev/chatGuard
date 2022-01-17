import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PmpDCEventStatus } from '../enums/pmp-dc-event-status';

export class UpdatePmpDcEventDto {
  @IsEnum(PmpDCEventStatus)
  @ApiProperty({
    example: PmpDCEventStatus.planned,
    description: 'status',
    required: true,
  })
  status: PmpDCEventStatus;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'something',
    description: 'comments for state change',
    required: false,
  })
  comment: string;
}
