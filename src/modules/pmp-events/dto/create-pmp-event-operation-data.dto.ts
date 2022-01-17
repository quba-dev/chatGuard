import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePmpEventOperationDataDto {
  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'operation id',
    required: true,
  })
  operationId: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'something something',
    description: 'measurement feedback',
    required: false,
  })
  feedback: string;

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    example: ['uuid1', 'uuid2'],
    description: 'array of file uuids',
    required: false,
  })
  fileIds: string[];
}
