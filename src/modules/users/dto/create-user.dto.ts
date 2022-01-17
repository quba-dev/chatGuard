import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from '../../authentication/enums/user-roles.enum';

const roleNames = [];
for (const enumMember in UserRole) {
  roleNames.push(enumMember);
}

export class CreateUserDto {
  @IsString()
  @ApiProperty({
    example: 'test@example.com',
    description: 'user email',
    required: true,
  })
  email: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '12345',
    description: 'user pwd',
    required: false,
  })
  password: string;

  @IsString()
  @ApiProperty({
    example: 'John',
    description: 'user first name',
    required: true,
  })
  firstName: string;

  @IsString()
  @ApiProperty({
    example: 'Doe',
    description: 'user last name',
    required: true,
  })
  lastName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'address one',
    description: 'user address line 1',
    required: false,
  })
  addressOne: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'address two',
    description: 'user address line 2',
    required: false,
  })
  addressTwo: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '12345',
    description: 'user postal code',
    required: false,
  })
  postalCode: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '0724123123',
    description: 'user phone number',
    required: false,
  })
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'uuid1',
    description: 'user avatar uuid',
    required: false,
  })
  avatarImageId: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '1',
    description: 'user country id',
    required: false,
  })
  countryId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '1',
    description: 'user city id',
    required: false,
  })
  cityId: number;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'user city id',
    required: true,
  })
  organizationId: number;

  @IsOptional()
  @ApiProperty({
    example: 'yyyy-mm-dd',
    description: 'user start date',
    required: true,
  })
  startDate: Date;

  @IsEnum(UserRole, { each: true })
  @ArrayUnique()
  @ApiProperty({
    example: [roleNames[0]],
    enum: roleNames,
    description: 'specify roles',
    required: true,
  })
  roleNames: UserRole[];
}
