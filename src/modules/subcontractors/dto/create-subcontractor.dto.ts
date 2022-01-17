import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateSubcontractorContactDto } from './create-subcontractorContact.dto';

export class CreateSubcontractorDto {
  @IsString()
  @ApiProperty({
    example: 'company name',
    description: 'company name',
    required: true,
  })
  companyName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'description',
    description: 'subcontractor description',
    required: false,
  })
  description: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'something.com',
    description: 'organization website',
    required: false,
  })
  websiteUrl: string;

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

  @IsArray()
  @ApiProperty({
    example: [1],
    type: 'array',
    description: 'array of subcontractor category ids',
    required: true,
  })
  subcontractorCategoriesIds: number[];

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'subcontractor organization id',
    required: true,
  })
  organizationId: number;

  @IsArray()
  @ApiProperty({
    example: [],
    type: 'array',
    description: 'array of subcontractor contact dtos',
    required: true,
  })
  contacts: CreateSubcontractorContactDto[];
}
