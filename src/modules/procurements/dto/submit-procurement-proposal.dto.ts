import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Currency } from '../enum/currency.enum';

export class SubmitProcurementProposalDto {
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    example: ['test1@example.com', 'test2@example.com'],
    description: 'cc emails to receive proposal',
    required: false,
  })
  ccEmails: string[];

  @IsString()
  @ApiProperty({
    example: 'uuid',
    description: 'proposal file uuid',
    required: true,
  })
  proposalFileUuid: string;

  @IsEnum(Currency)
  @ApiProperty({
    example: Currency.RON,
    enum: Currency,
    description: 'proposal currency',
    required: true,
  })
  currency: Currency;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'proposal amount',
    required: true,
  })
  amount: number;
}
