import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { In, Repository } from 'typeorm';
import {
  BeneficiaryOrgRoles,
  ProviderOrgRoles,
  ProviderOrgRolesAll,
  TenantOrgRoles,
  UserRole,
  UserRoleTitles,
} from './enums/user-roles.enum';
import { OrganizationTypes } from '../organizations/enums/organization-types.enum';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async findByOrganizationType(orgType: string) {
    let data = [];
    if (orgType === OrganizationTypes.provider) {
      data = await this.rolesRepository.find({
        where: { name: In(ProviderOrgRolesAll) },
      });
    }
    if (orgType === OrganizationTypes.beneficiary) {
      data = await this.rolesRepository.find({
        where: { name: In(BeneficiaryOrgRoles) },
      });
    }
    if (orgType === OrganizationTypes.tenant) {
      data = await this.rolesRepository.find({
        where: { name: In(TenantOrgRoles) },
      });
    }

    return {
      total: data.length,
      data,
    };
  }

  async createRoles() {
    const roleKeys = Object.keys(UserRole);
    for (const roleKey of roleKeys) {
      let roleDB = await this.rolesRepository.findOne({
        where: { name: UserRole[roleKey] },
      });
      if (!roleDB) {
        roleDB = new Role();
        roleDB.name = UserRole[roleKey];
        roleDB.title = UserRoleTitles[roleKey];
        await this.rolesRepository.save(roleDB);
      }
    }
  }
}
