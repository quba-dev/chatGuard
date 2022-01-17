import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Role } from '../../authentication/entities/role.entity';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  roles: Role[];

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    example: true,
    description: 'send notifications over email',
    required: false,
  })
  sendEmails: boolean;
}
