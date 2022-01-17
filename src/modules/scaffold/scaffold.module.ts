import { Module } from '@nestjs/common';
import { ScaffoldService } from './scaffold.service';
import { ScaffoldController } from './scaffold.controller';
import { ProjectsModule } from '../projects/projects.module';
import { BuildingsModule } from '../buildings/buildings.module';
import { EquipmentsModule } from '../equipments/equipments.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { StandardProceduresModule } from '../standard-procedures/standard-procedures.module';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../authentication/entities/role.entity';

@Module({
  imports: [
    ProjectsModule,
    BuildingsModule,
    EquipmentsModule,
    OrganizationsModule,
    StandardProceduresModule,
    UsersModule,
    TypeOrmModule.forFeature([Organization, User, Role]),
  ],
  controllers: [ScaffoldController],
  providers: [ScaffoldService],
})
export class ScaffoldModule {}
