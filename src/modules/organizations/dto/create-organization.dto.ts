import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { OrganizationTypes } from '../enums/organization-types.enum';

export class CreateOrganizationDto {
  @IsString()
  @ApiProperty({
    example: 'organization',
    description: 'organization name',
    required: true,
  })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'something.com',
    description: 'organization website',
    required: false,
  })
  websiteUrl?: string;

  @IsEnum(OrganizationTypes)
  @ApiProperty({
    example: OrganizationTypes.tenant,
    enum: OrganizationTypes,
    description: 'organization type',
    required: true,
  })
  type: OrganizationTypes;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'address one',
    description: 'user address line 1',
    required: false,
  })
  addressOne?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'address two',
    description: 'user address line 2',
    required: false,
  })
  addressTwo?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '12345',
    description: 'user postal code',
    required: false,
  })
  postalCode?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '1',
    description: 'user country id',
    required: false,
  })
  countryId?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '1',
    description: 'user city id',
    required: false,
  })
  cityId?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '1',
    description: 'parent organization id',
    required: false,
  })
  parentOrganizationId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '102',
    description: 'manager id',
    required: false,
  })
  managerId?: number;
}
