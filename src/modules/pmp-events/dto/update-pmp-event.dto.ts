import { PartialType } from '@nestjs/swagger';
import { CreatePmpEventDto } from './create-pmp-event.dto';

export class UpdatePmpEventDto extends PartialType(CreatePmpEventDto) {}
