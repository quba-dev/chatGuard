import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @ApiProperty({
    example: '12345',
    description: 'user otp',
    required: true,
  })
  oldPassword: string;

  @IsString()
  @ApiProperty({
    example: '12345',
    description: 'user pwd',
    required: true,
  })
  newPassword: string;
}
