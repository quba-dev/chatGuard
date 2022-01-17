import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @ApiProperty({
    example: 'project',
    description: 'project name',
    required: true,
  })
  name: string;

  @IsDateString()
  @ApiProperty({
    example: 'yyyy-mm-dd',
    description: 'project start date',
    required: true,
  })
  startDate: Date;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'the project is about this',
    description: 'project summary',
    required: false,
  })
  summary: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 1,
    description: 'takes media_file_id',
    required: false,
  })
  primaryImageId: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
    description: 'project country id',
    required: false,
  })
  countryId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
    description: 'project city id',
    required: false,
  })
  cityId: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'address one',
    description: 'project address one',
    required: false,
  })
  addressOne: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'address two',
    description: 'project address two',
    required: false,
  })
  addressTwo: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '12345',
    description: 'project postal code',
    required: false,
  })
  postalCode: string;

  //general contractor
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'name',
    description: 'project general contractor name',
    required: false,
  })
  generalContractorName: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
    description: 'project general contractor country id',
    required: false,
  })
  generalContractorCountryId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
    description: 'project general contractor country id',
    required: false,
  })
  generalContractorCityId: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'address one',
    description: 'project general contractor address one',
    required: false,
  })
  generalContractorAddressOne: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'address two',
    description: 'project general contractor address two',
    required: false,
  })
  generalContractorAddressTwo: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '12345',
    description: 'project general contractor postal code',
    required: false,
  })
  generalContractorPostalCode: string;

  //general contractor contact
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'joe contractor',
    description: 'project general contractor contact name',
    required: false,
  })
  generalContractorContact: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'joe.contractor@example.com',
    description: 'project general contractor contact email',
    required: false,
  })
  generalContractorEmail: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '0724123456',
    description: 'project general contractor contact phone number',
    required: false,
  })
  generalContractorPhoneNumber: string;

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    example: ['uuid1', 'uuid2'],
    description: 'array of file uuids',
    required: false,
  })
  generalContractorWarrantyFileIds: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    example: ['uuid1', 'uuid2'],
    description: 'array of file uuids',
    required: false,
  })
  mediaGalleryFileIds: string[];
}
