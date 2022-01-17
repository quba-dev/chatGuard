import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { buildPaginationObject } from '../../util/pagination';
import { checkForRole, checkForRoles } from '../../util/roles';
import { DeepPartial, In, Repository } from 'typeorm';
import { UserRole } from '../authentication/enums/user-roles.enum';
import { AppConfig } from '../configuration/configuration.service';
import { User } from '../users/entities/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './entities/organization.entity';
import { OrganizationTypes } from './enums/organization-types.enum';
import { City } from '../geoLocation/entities/city.entity';
import { Country } from '../geoLocation/entities/country.entity';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { readFileSync } from 'fs';
import * as bcrypt from 'bcrypt';
import { Role } from '../authentication/entities/role.entity';
import { sanitizeWithRelations } from '../../util/util';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Country)
    private countriesRepository: Repository<Country>,
    @InjectRepository(City)
    private citiesRepository: Repository<City>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private config: AppConfig,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto, userId: number) {
    const organizationData: DeepPartial<Organization> = {
      ...createOrganizationDto,
    };

    if (userId) {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['organization'],
      });
      if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

      if (organizationData.type != OrganizationTypes.provider) {
        const parentOrganization = user.organization;
        if (!parentOrganization)
          throw new BadRequestException(ErrorTypes.ORGANIZATION_NOT_FOUND);
        if (parentOrganization.type !== OrganizationTypes.provider)
          throw new BadRequestException(
            ErrorTypes.PARENT_ORGANIZATION_TYPE_MUST_BE_PROVIDER,
          );

        organizationData.parentOrganization = parentOrganization;
      }
    }

    if (createOrganizationDto.countryId) {
      const country = await this.countriesRepository.findOne(
        createOrganizationDto.countryId,
      );
      if (country) {
        organizationData.country = country;
      }
    }

    if (createOrganizationDto.cityId) {
      const city = await this.citiesRepository.findOne(
        createOrganizationDto.cityId,
      );
      if (city) {
        organizationData.city = city;
      }
    }

    const organization = this.organizationsRepository.create(organizationData);
    await this.organizationsRepository.save(organization);

    return organization;
  }

  async findAll() {
    return await this.organizationsRepository.find({
      relations: ['city', 'country', 'manager'],
      order: { name: 'ASC' },
    });
  }

  async getOrganizationsForUser(
    page = 0,
    limit = 0,
    userId: number,
    withRelations: string,
  ) {
    const extraRelations = sanitizeWithRelations(
      [
        'users',
        'users.roles',
        'users.avatarImage',
        'city',
        'country',
        'subcontractors',
        'manager',
      ],
      withRelations,
    );
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const paginationObject = buildPaginationObject(page, limit);

    let whereObject = {};
    if (checkForRole(UserRole.superAdmin, user.roles)) {
      whereObject = {};
    } else {
      if (user.organization.type === OrganizationTypes.provider) {
        whereObject = {
          where: [
            { parentOrganization: user.organization },
            { id: user.organization.id },
          ],
        };
      } else {
        whereObject = {
          where: {
            id: user.organization.id,
          },
        };
      }
    }
    const totalCount = await this.organizationsRepository.count({
      ...whereObject,
    });
    const data = await this.organizationsRepository.find({
      ...whereObject,
      relations: [...extraRelations],
      ...paginationObject,
      order: { id: 'DESC' },
    });
    return {
      total: totalCount,
      data,
    };
  }

  async getOrganizationsForUserByType(type: OrganizationTypes, userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    let whereObject = {};
    if (checkForRole(UserRole.superAdmin, user.roles)) {
      whereObject = {
        where: {
          type,
        },
      };
    } else {
      if (user.organization.type === OrganizationTypes.provider) {
        whereObject = {
          where: [
            { parentOrganization: user.organization, type },
            { id: user.organization.id, type },
          ],
        };
      } else {
        whereObject = {
          where: {
            id: user.organization.id,
            type,
          },
        };
      }
    }
    const totalCount = await this.organizationsRepository.count({
      ...whereObject,
    });
    const data = await this.organizationsRepository.find({
      ...whereObject,
      relations: [
        'city',
        'country',
        'users',
        'users.roles',
        'users.avatarImage',
      ],
      order: { id: 'DESC' },
    });
    return {
      total: totalCount,
      data,
    };
  }

  async findOne(id: number, excludeRoles = '') {
    const rolesToExclude = [];
    const roles = excludeRoles.split(',');
    for (const role of roles) {
      if (UserRole[role]) rolesToExclude.push(role);
    }
    console.log(roles, excludeRoles, rolesToExclude);

    const org = await this.organizationsRepository.findOne({
      where: { id },
      relations: [
        'city',
        'country',
        'users',
        'users.roles',
        'users.avatarImage',
        'manager',
      ],
    });

    if (excludeRoles.length > 0) {
      const filteredUsers = [];
      for (const user of org.users) {
        if (!checkForRoles(rolesToExclude, user.roles)) {
          filteredUsers.push(user);
        }
      }

      org.users = filteredUsers;
    }
    return org;
  }

  async findOneByName(name: string) {
    return await this.organizationsRepository.findOne({
      where: { name },
    });
  }

  async update(
    id: number,
    updateOrganizationDto: UpdateOrganizationDto,
    userId: number,
  ) {
    const organizationToUpdate = await this.organizationsRepository.findOne({
      where: { id: id },
      relations: ['parentOrganization'],
    });
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'roles'],
    });

    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);
    if (
      organizationToUpdate.type != OrganizationTypes.provider &&
      user.organization.id != organizationToUpdate.parentOrganization.id
    )
      throw new ForbiddenException();
    if (
      user.organization.id != id &&
      !checkForRole(UserRole.superAdmin, user.roles) &&
      organizationToUpdate.type == OrganizationTypes.provider
    )
      throw new ForbiddenException();

    const organizationData: DeepPartial<Organization> = {
      ...updateOrganizationDto,
    };
    if (updateOrganizationDto.managerId) {
      const manager = await this.usersRepository.findOne({
        where: { id: updateOrganizationDto.managerId },
        relations: ['organization'],
      });
      if (!manager) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);
      if (manager.organization.id != id)
        throw new BadRequestException(ErrorTypes.USER_NOT_IN_ORGANIZATION);

      organizationData.manager = manager;
    }

    if (updateOrganizationDto.countryId) {
      const country = await this.countriesRepository.findOne(
        updateOrganizationDto.countryId,
      );
      if (country) {
        organizationData.country = country;
      }
    }

    if (updateOrganizationDto.cityId) {
      const city = await this.citiesRepository.findOne(
        updateOrganizationDto.cityId,
      );
      if (city) {
        organizationData.city = city;
      }
    }

    organizationData['id'] = id;
    const organizationDB = await this.organizationsRepository.preload(
      organizationData,
    );
    return await this.organizationsRepository.save(organizationDB);
  }

  async remove(id: number) {
    try {
      const organization = await this.findOne(id);
      if (!organization) {
        throw new Error();
      }
      await this.organizationsRepository.remove(organization);
    } catch (e) {
      if (e.code == 23503) {
        throw new BadRequestException(
          ErrorTypes.UNABLE_TO_DELETE_ORGANIZATION_FK_CONSTRAINT,
        );
      }
      throw new BadRequestException(ErrorTypes.UNABLE_TO_DELETE_ORGANIZATION);
    }
    return true;
  }

  async populateDefaultProviderOrg() {
    const roles = await this.rolesRepository.find({
      where: { name: In(['admin']) },
    });

    const content = readFileSync(
      'src/modules/standard-procedures/data/org.json',
      'utf-8',
    );
    const defaultOrgNames = JSON.parse(content);
    for (const defaultOrgName of defaultOrgNames) {
      let organization = await this.organizationsRepository.findOne({
        where: { name: defaultOrgName },
      });
      if (!organization) {
        organization = new Organization();
        organization.name = defaultOrgName;
        organization.type = OrganizationTypes.provider;

        await this.organizationsRepository.save(organization);
        const user = new User();
        user.organization = organization;
        user.email = `admin@${defaultOrgName
          .replace(/\s+/g, '')
          .toLowerCase()}.com`;
        user.password = await bcrypt.hash('1234', 10);
        user.firstName = 'Admin';
        user.lastName = 'Default';
        user.roles = roles;

        await this.usersRepository.save(user);
      }
    }
  }

  async populateDefaultCountriesForProviderOrg() {
    const content = readFileSync(
      'src/modules/standard-procedures/data/org.json',
      'utf-8',
    );
    const defaultOrgNames = JSON.parse(content);

    for (const defaultOrgName of defaultOrgNames) {
      const organization = await this.organizationsRepository.findOne({
        where: { name: defaultOrgName },
        relations: ['defaultCountries'],
      });
      if (organization && organization.defaultCountries.length == 0) {
        const countries = await this.countriesRepository.find({
          where: { countryName: In(['Romania', 'Saudi Arabia']) },
        });
        organization.defaultCountries = countries;

        await this.organizationsRepository.save(organization);
      }
    }
  }
}
