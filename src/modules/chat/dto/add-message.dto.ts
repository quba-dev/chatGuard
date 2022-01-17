import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class AddMessageDto {
  @IsString()
  @ApiProperty({
    example: 'hello world',
    description: 'contents of the message',
    required: true,
  })
  message: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    example: ['a3af2bb7-0054-41f9-9791-cfad8ccf39b1'],
    type: 'array',
    description: 'array of file upload uuids',
    required: false,
  })
  files?: string[];
}
