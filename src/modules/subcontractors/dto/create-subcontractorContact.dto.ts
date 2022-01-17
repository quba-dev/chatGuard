import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSubcontractorContactDto {
  @IsString()
  @ApiProperty({
    example: 'John Doe',
    description: 'subcontractor contact name',
    required: true,
  })
  name: string;

  @IsString()
  @ApiProperty({
    example: 'test@example.com',
    description: 'subcontractor contact email',
    required: true,
  })
  email: string;

  @IsString()
  @ApiProperty({
    example: '0724123123',
    description: 'subcontractor contact phone number',
    required: true,
  })
  phoneNumber: string;

  @IsString()
  @ApiProperty({
    example: 'accounting',
    description: 'subcontractor contact department',
    required: true,
  })
  department: string;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'subcontractor id',
    required: false,
  })
  subcontractorId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: '1',
    description: 'subcontractor contact id',
    required: false,
  })
  id: number;
}
