import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from '../authentication/entities/role.entity';
import { AppConfigModule } from '../configuration/configuration.module';
import { Organization } from '../organizations/entities/organization.entity';
import { City } from '../geoLocation/entities/city.entity';
import { Country } from '../geoLocation/entities/country.entity';
import { File } from '../files/entities/file.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Procurement } from '../procurements/entities/procurement.entity';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forFeature([
      User,
      Role,
      Organization,
      City,
      Country,
      File,
      Ticket,
      Procurement,
      Project,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
