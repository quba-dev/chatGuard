import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { City } from '../geoLocation/entities/city.entity';
import { Country } from '../geoLocation/entities/country.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { CreateSubcontractorDto } from './dto/create-subcontractor.dto';
import { UpdateSubcontractorDto } from './dto/update-subcontractor.dto';
import { Subcontractor } from './entities/subcontractor.entity';
import { SubcontractorCategory } from './entities/subcontractor-category.entity';
import { SubcontractorContact } from './entities/subcontractor-contact.entity';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { User } from '../users/entities/user.entity';
import { OrganizationTypes } from '../organizations/enums/organization-types.enum';
import { Project } from '../projects/entities/project.entity';

@Injectable()
export class SubcontractorsService {
  constructor(
    @InjectRepository(SubcontractorCategory)
    private subcontractorCategoriesRepository: Repository<SubcontractorCategory>,
    @InjectRepository(SubcontractorContact)
    private subcontractorContactsRepository: Repository<SubcontractorContact>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(Subcontractor)
    private subcontractorRepository: Repository<Subcontractor>,
    @InjectRepository(Country)
    private countriesRepository: Repository<Country>,
    @InjectRepository(City)
    private citiesRepository: Repository<City>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private config: AppConfig,
  ) {}

  async create(createSubcontractorDto: CreateSubcontractorDto) {
    const organization = await this.organizationsRepository.findOne({
      id: createSubcontractorDto.organizationId,
    });

    if (!organization)
      throw new BadRequestException(ErrorTypes.ORGANIZATION_NOT_FOUND);

    const subcontractorCategories =
      await this.subcontractorCategoriesRepository.find({
        where: { id: In(createSubcontractorDto.subcontractorCategoriesIds) },
      });
    let contactsDB = [];
    if (
      createSubcontractorDto.contacts &&
      createSubcontractorDto.contacts.length > 0
    ) {
      const contactsToCreate = [];
      for (const contact of createSubcontractorDto.contacts) {
        contactsToCreate.push(
          this.subcontractorContactsRepository.create(contact),
        );
      }
      contactsDB = await this.subcontractorContactsRepository.save(
        contactsToCreate,
      );
    }

    const subcontractorData: DeepPartial<Subcontractor> = {
      ...createSubcontractorDto,
      organization,
      contacts: contactsDB,
      subcontractorCategories: subcontractorCategories,
    };

    if (createSubcontractorDto.countryId) {
      const country = await this.countriesRepository.findOne(
        createSubcontractorDto.countryId,
      );
      if (country) {
        subcontractorData.country = country;
      }
    }

    if (createSubcontractorDto.cityId) {
      const city = await this.citiesRepository.findOne(
        createSubcontractorDto.cityId,
      );
      if (city) {
        subcontractorData.city = city;
      }
    }

    await this.subcontractorRepository.save(subcontractorData);
    return true;
  }

  async findAll(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'organization.parentOrganization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);
    if (!user.organization) return { total: 0, data: [] };

    const data = await this.subcontractorRepository.find({
      where: {
        organization: {
          id:
            user.organization.type == OrganizationTypes.provider
              ? user.organization.id
              : user.organization.parentOrganization.id,
        },
      },
      relations: [
        'organization',
        'subcontractorCategories',
        'contacts',
        'city',
        'country',
      ],
    });
    return {
      total: data.length,
      data,
    };
  }

  async findAllInProject(projectId: number, userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['equipments', 'equipments.maintenanceProcedures'],
    });

    const subcontractorIds = [];
    for (const equipment of project.equipments) {
      for (const procedure of equipment.maintenanceProcedures) {
        if (
          procedure.subcontractorId &&
          subcontractorIds.indexOf(procedure.subcontractorId) == -1
        ) {
          subcontractorIds.push(procedure.subcontractorId);
        }
      }
    }

    const data = await this.subcontractorRepository.find({
      where: { id: In(subcontractorIds) },
      relations: [
        'organization',
        'subcontractorCategories',
        'contacts',
        'city',
        'country',
      ],
    });
    return {
      total: data.length,
      data,
    };
  }

  async findOne(id: number) {
    const data = await this.subcontractorRepository.findOne({
      where: { id },
      relations: [
        'organization',
        'subcontractorCategories',
        'contacts',
        'city',
        'country',
      ],
    });
    return data;
  }

  async findAllGroupedBySubcontractorCategory() {
    const data = await this.subcontractorCategoriesRepository.find({
      relations: ['subcontractors'],
    });
    return {
      total: data.length,
      data,
    };
  }

  async update(id: number, updateSubcontractorDto: UpdateSubcontractorDto) {
    let organization = null;
    if (updateSubcontractorDto.organizationId) {
      organization = await this.organizationsRepository.findOne({
        id: updateSubcontractorDto.organizationId,
      });
      if (!organization)
        throw new BadRequestException(ErrorTypes.ORGANIZATION_NOT_FOUND);
    }

    let subcontractorCategories = null;
    if (updateSubcontractorDto.subcontractorCategoriesIds) {
      subcontractorCategories =
        await this.subcontractorCategoriesRepository.find({
          where: { id: In(updateSubcontractorDto.subcontractorCategoriesIds) },
        });
    }

    let contactsDB = null;
    if (
      updateSubcontractorDto.contacts &&
      updateSubcontractorDto.contacts.length > 0
    ) {
      contactsDB = [];
      const contactsToUpsert = [];

      for (const contact of updateSubcontractorDto.contacts) {
        if (contact.id) {
          contactsToUpsert.push(
            await this.subcontractorContactsRepository.preload(contact),
          );
        } else {
          contactsToUpsert.push(
            this.subcontractorContactsRepository.create(contact),
          );
        }
      }
      contactsDB = await this.subcontractorContactsRepository.save(
        contactsToUpsert,
      );
    }

    const subcontractorData: DeepPartial<Subcontractor> = {
      ...updateSubcontractorDto,
    };
    if (organization) {
      subcontractorData['organization'] = organization;
    }
    if (contactsDB) {
      subcontractorData['contacts'] = contactsDB;
    }
    if (subcontractorCategories) {
      subcontractorData['subcontractorCategories'] = subcontractorCategories;
    }
    if (updateSubcontractorDto.countryId) {
      const country = await this.countriesRepository.findOne(
        updateSubcontractorDto.countryId,
      );
      if (country) {
        subcontractorData.country = country;
      }
    }

    if (updateSubcontractorDto.cityId) {
      const city = await this.citiesRepository.findOne(
        updateSubcontractorDto.cityId,
      );
      if (city) {
        subcontractorData.city = city;
      }
    }
    subcontractorData['id'] = id;

    const subcontractor = await this.subcontractorRepository.preload(
      subcontractorData,
    );
    return await this.subcontractorRepository.save(subcontractor);
  }

  async remove(id: number) {
    try {
      await this.subcontractorRepository.delete(id);
    } catch (e) {
      if (e.code == 23503) {
        throw new BadRequestException(
          ErrorTypes.UNABLE_TO_DELETE_SUBCONTRACTOR_FK_CONSTRAINT,
        );
      }
      throw new BadRequestException(ErrorTypes.UNABLE_TO_DELETE_SUBCONTRACTOR);
    }
    return true;
  }
}
