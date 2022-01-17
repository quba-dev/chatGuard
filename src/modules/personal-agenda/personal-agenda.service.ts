import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { buildPaginationObject } from '../../util/pagination';
import { DeepPartial, Repository } from 'typeorm';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { User } from '../users/entities/user.entity';
import { CreatePersonalAgendaDto } from './dto/create-personal-agenda.dto';
import { UpdatePersonalAgendaDto } from './dto/update-personal-agenda.dto';
import { PersonalAgenda } from './entities/personal-agenda.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class PersonalAgendaService {
  constructor(
    @InjectRepository(PersonalAgenda)
    private personalAgendaRepository: Repository<PersonalAgenda>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createPersonalAgendaDto: CreatePersonalAgendaDto,
    userId: number,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const personalAgendaNewData: DeepPartial<PersonalAgenda> = {
      ...createPersonalAgendaDto,
    };
    if (personalAgendaNewData.timestamp_start) {
      if (!personalAgendaNewData.timestamp_end)
        throw new BadRequestException(
          ErrorTypes.PERSONAL_AGENDA_MUST_RECEIVE_BOTH_START_AND_END_DATES,
        );
      if (
        personalAgendaNewData.timestamp_end <
        personalAgendaNewData.timestamp_start
      )
        throw new BadRequestException(
          ErrorTypes.PERSONAL_AGENDA_START_DATE_MUST_BE_BEFORE_END_DATE,
        );
      if (personalAgendaNewData.timestamp_reminder) {
        if (
          personalAgendaNewData.timestamp_reminder >
          personalAgendaNewData.timestamp_start
        )
          throw new BadRequestException(
            ErrorTypes.PERSONAL_AGENDA_REMINDER_DATE_MUST_BE_BEFORE_START_DATE,
          );
      }
    }
    if (
      personalAgendaNewData.timestamp_reminder &&
      (!personalAgendaNewData.timestamp_start ||
        !personalAgendaNewData.timestamp_end)
    )
      throw new BadRequestException(
        ErrorTypes.PERSONAL_AGENDA_MUST_RECEIVE_BOTH_START_AND_END_DATES,
      );

    const personalAgenda = this.personalAgendaRepository.create(
      personalAgendaNewData,
    );

    personalAgenda.user = user;
    await this.personalAgendaRepository.save(personalAgenda);

    return personalAgenda;
  }

  async getPersonalAgendaForUser(page = 0, limit = 0, userId: number) {
    const paginationObject = buildPaginationObject(page, limit);

    const whereObject = {
      where: {
        user: { id: userId },
      },
    };
    const totalCount = await this.personalAgendaRepository.count({
      ...whereObject,
    });
    const data = await this.personalAgendaRepository.find({
      ...whereObject,
      ...paginationObject,
      order: { id: 'DESC' },
    });
    return {
      total: totalCount,
      data,
    };
  }

  async findOne(id: number, userId: number) {
    const data = await this.personalAgendaRepository.findOne({
      where: { id },
    });
    if (data.userId != userId) throw new ForbiddenException();

    return data;
  }

  async update(
    id: number,
    updatePersonalAgendaDto: UpdatePersonalAgendaDto,
    userId: number,
  ) {
    const personalAgendaToUpdate = await this.personalAgendaRepository.findOne({
      where: { id },
    });
    if (personalAgendaToUpdate.userId != userId) throw new ForbiddenException();

    const personalAgendaNewData: DeepPartial<PersonalAgenda> = {
      ...updatePersonalAgendaDto,
    };

    if (personalAgendaNewData.timestamp_reminder) {
      if (personalAgendaNewData.timestamp_start) {
        if (
          personalAgendaNewData.timestamp_reminder >
          personalAgendaNewData.timestamp_start
        )
          throw new BadRequestException(
            ErrorTypes.PERSONAL_AGENDA_REMINDER_DATE_MUST_BE_BEFORE_START_DATE,
          );
      } else {
        if (
          personalAgendaNewData.timestamp_reminder >
          personalAgendaToUpdate.timestamp_start
        )
          throw new BadRequestException(
            ErrorTypes.PERSONAL_AGENDA_REMINDER_DATE_MUST_BE_BEFORE_START_DATE,
          );
      }
    }

    if (personalAgendaNewData.timestamp_start) {
      if (personalAgendaNewData.timestamp_end) {
        if (
          personalAgendaNewData.timestamp_start >
          personalAgendaNewData.timestamp_end
        )
          throw new BadRequestException(
            ErrorTypes.PERSONAL_AGENDA_START_DATE_MUST_BE_BEFORE_END_DATE,
          );
        if (!personalAgendaNewData.timestamp_reminder) {
          if (personalAgendaToUpdate.timestamp_reminder) {
            const oldStartDate = dayjs(personalAgendaToUpdate.timestamp_start);
            const oldReminderDate = dayjs(
              personalAgendaToUpdate.timestamp_reminder,
            );

            const diffDays = oldStartDate.diff(oldReminderDate, 'second');

            const newReminderDate = dayjs(
              updatePersonalAgendaDto.timestamp_start,
            ).subtract(diffDays, 'second');

            const today = new Date(Date.now());
            if (newReminderDate.toDate() < today) {
              personalAgendaNewData.timestamp_reminder = null;
            } else {
              personalAgendaNewData.timestamp_reminder =
                newReminderDate.toDate();
            }
          }
        }
      } else {
        if (
          personalAgendaNewData.timestamp_start >
          personalAgendaToUpdate.timestamp_end
        )
          throw new BadRequestException(
            ErrorTypes.PERSONAL_AGENDA_START_DATE_MUST_BE_BEFORE_END_DATE,
          );
      }
    }

    personalAgendaNewData['id'] = id;
    const personalAgendaDB = await this.personalAgendaRepository.preload(
      personalAgendaNewData,
    );

    return await this.personalAgendaRepository.save(personalAgendaDB);
  }

  async remove(id: number, userId: number) {
    const personalAgendaToDelete = await this.personalAgendaRepository.findOne(
      id,
    );
    if (!personalAgendaToDelete)
      throw new BadRequestException(ErrorTypes.PERSONAL_AGENDA_DOES_NOT_EXIST);
    if (personalAgendaToDelete.userId != userId) throw new ForbiddenException();

    try {
      await this.personalAgendaRepository.remove(personalAgendaToDelete);
    } catch (e) {
      throw new BadRequestException(
        ErrorTypes.UNABLE_TO_DELETE_PERSONAL_AGENDA,
      );
    }

    return true;
  }
}
