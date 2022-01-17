import { Module } from '@nestjs/common';
import { PersonalAgendaService } from './personal-agenda.service';
import { PersonalAgendaController } from './personal-agenda.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalAgenda } from './entities/personal-agenda.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PersonalAgenda, User])],
  controllers: [PersonalAgendaController],
  providers: [PersonalAgendaService],
  exports: [PersonalAgendaService],
})
export class PersonalAgendaModule {}
