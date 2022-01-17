import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateEquipmentInputDto {
  @IsString()
  @ApiProperty({
    example: 'equipment',
    description: 'equipment input name',
    required: true,
  })
  name: string;

  @IsString()
  @ApiProperty({
    example: 'equipment',
    description: 'equipment input value',
    required: true,
  })
  value: string;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'equipment input unit id',
    required: true,
  })
  unitId: number;
}
