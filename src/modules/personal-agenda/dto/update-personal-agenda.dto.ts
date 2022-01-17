import { PartialType } from '@nestjs/swagger';
import { CreatePersonalAgendaDto } from './create-personal-agenda.dto';

export class UpdatePersonalAgendaDto extends PartialType(
  CreatePersonalAgendaDto,
) {}
