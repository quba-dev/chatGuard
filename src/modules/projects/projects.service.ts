import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { buildPaginationObject } from '../../util/pagination';
import {
  checkForRole,
  checkForRoles,
  checkIfUserHasAccessToProject,
} from '../../util/roles';
import {
  Between,
  Connection,
  DeepPartial,
  In,
  LessThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import {
  ProviderOrgManagementRoles,
  UserRole,
} from '../authentication/enums/user-roles.enum';
import { AppConfig } from '../configuration/configuration.service';
import { City } from '../geoLocation/entities/city.entity';
import { Country } from '../geoLocation/entities/country.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { OrganizationTypes } from '../organizations/enums/organization-types.enum';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { StandardEquipmentProjectCategory } from '../standard-procedures/entities/standard-equipment-project-category';
import { EquipmentProjectCategory } from '../equipments/entities/equipment-project-category.entity';
import { ProjectStatus } from './enums/project-status.enum';
import * as dayjs from 'dayjs';
import { PmpEvent } from '../pmp-events/entities/pmp-event.entity';
import { File } from '../files/entities/file.entity';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { Device } from './entities/device.entity';
import { MaintenanceProceduresService } from '../maintenance-procedures/maintenance-procedures.service';
import { UsersService } from '../users/users.service';
import { PmpEventStatus } from '../pmp-events/enums/pmp-event-status';
import { ChatTypes } from '../chat/enums/chat-types.enum';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class ProjectsService {
  constructor(
    private connection: Connection,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Country)
    private countriesRepository: Repository<Country>,
    @InjectRepository(City)
    private citiesRepository: Repository<City>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(StandardEquipmentProjectCategory)
    private standardEquipmentProjectCategoriesRepository: Repository<StandardEquipmentProjectCategory>,
    @InjectRepository(EquipmentProjectCategory)
    private equipmentProjectCategoriesRepository: Repository<EquipmentProjectCategory>,
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
    @InjectRepository(PmpEvent)
    private pmpEventsRepository: Repository<PmpEvent>,
    private config: AppConfig,
    private maintenanceProceduresService: MaintenanceProceduresService,
    private usersService: UsersService,
    private readonly chatService: ChatService,
  ) {}

  async checkProjectExists(projectId: number) {
    const projectCount = await this.projectsRepository.count({
      where: { id: projectId },
    });
    if (projectCount == 0) throw new NotFoundException();
    if (projectCount > 1) throw new InternalServerErrorException();
  }

  async create(createProjectDto: CreateProjectDto, userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);
    if (!user.organization)
      throw new BadRequestException(
        ErrorTypes.USER_MUST_BE_PART_OF_ORGANIZATION,
      );
    if (user.organization.type !== OrganizationTypes.provider)
      throw new BadRequestException(ErrorTypes.INVALID_ORGANIZATION_TYPE);

    const projectData: DeepPartial<Project> = {
      ...createProjectDto,
    };

    if (createProjectDto.primaryImageId) {
      const primaryImage = await this.filesRepository.findOne(
        createProjectDto.primaryImageId,
      );
      if (primaryImage) {
        projectData.primaryImage = primaryImage;
      }
    }

    if (createProjectDto.countryId) {
      const country = await this.countriesRepository.findOne(
        createProjectDto.countryId,
      );
      if (country) {
        projectData.country = country;
      }
    }

    if (createProjectDto.cityId) {
      const city = await this.citiesRepository.findOne(createProjectDto.cityId);
      if (city) {
        projectData.city = city;
      }
    }

    if (createProjectDto.generalContractorCountryId) {
      const country = await this.countriesRepository.findOne(
        createProjectDto.countryId,
      );
      if (country) {
        projectData.generalContractorCountry = country;
      }
    }

    if (createProjectDto.generalContractorCityId) {
      const city = await this.citiesRepository.findOne(createProjectDto.cityId);
      if (city) {
        projectData.generalContractorCity = city;
      }
    }

    if (user.organization) {
      projectData.providerOrganization = user.organization;
    }

    if (checkForRole(UserRole.coordinator, user.roles)) {
      projectData.users = [user];
    }

    if (createProjectDto.generalContractorWarrantyFileIds) {
      const files = [];
      for (const fileId of createProjectDto.generalContractorWarrantyFileIds) {
        try {
          const file = await this.filesRepository.findOne(fileId);
          if (file) {
            files.push(file);
          }
        } catch (e) {}
      }
      projectData.generalContractorWarrantyFiles = files;
    }

    if (createProjectDto.mediaGalleryFileIds) {
      const files = [];
      for (const fileId of createProjectDto.mediaGalleryFileIds) {
        try {
          const file = await this.filesRepository.findOne(fileId);
          if (file) {
            files.push(file);
          }
        } catch (e) {}
      }
      projectData.mediaGalleryFiles = files;
    }

    const project = this.projectsRepository.create(projectData);
    await this.projectsRepository.save(project);

    const projectCategories =
      await this.standardEquipmentProjectCategoriesRepository.find({
        where: { organization: { id: user.organization.id } },
      });
    for (const projectCategory of projectCategories) {
      const projectCategoryDB = new EquipmentProjectCategory();
      projectCategoryDB.name = projectCategory.name;
      projectCategoryDB.project = project;
      await this.equipmentProjectCategoriesRepository.save(projectCategoryDB);
    }

    return {
      id: project.id,
    };
  }

  async assignDeviceToProject(
    projectId: number,
    userId: number,
    deviceId: string,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);

    let device = await this.devicesRepository.findOne({
      where: { project: { id: projectId }, deviceId },
    });
    if (!device) {
      device = new Device();
      device.project = project;
      device.deviceId = deviceId;
      await this.devicesRepository.save(device);
    }

    return device.uuid;
  }

  async getTechniciansInProject(uuid: string) {
    const device = await this.devicesRepository.findOne({
      where: { uuid },
      relations: ['project', 'project.users', 'project.users.roles'],
    });

    const technicians = [];
    for (const user of device.project.users) {
      if (checkForRole(UserRole.technician, user.roles)) {
        technicians.push(user);
      }
    }
    return {
      total: technicians.length,
      data: technicians,
    };
  }

  async assignUserToProject(
    userIdToAssign: number,
    projectId: number,
    userId: number,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);
    if (
      !checkForRole(UserRole.admin, user.roles) &&
      !checkForRole(UserRole.coordinator, user.roles)
    )
      throw new BadRequestException(ErrorTypes.USER_DOES_NOT_HAVE_A_VALID_ROLE);

    const userToAssign = await this.usersRepository.findOne({
      where: { id: userIdToAssign },
      relations: ['organization', 'projects', 'roles'],
    });
    if (!userToAssign)
      throw new BadRequestException(ErrorTypes.USER_TO_ASSIGN_NOT_FOUND);
    if (!userToAssign.organization)
      throw new BadRequestException(
        ErrorTypes.USER_TO_ASIGN_IS_NOT_PART_OF_AN_ORGANIZATION,
      );

    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['beneficiaryChannel', 'managementChannel', 'staffChannel'],
    });
    if (!project) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);

    const projectToAddIndex = userToAssign.projects
      .map((project) => project.id)
      .indexOf(project.id);

    if (projectToAddIndex == -1) {
      userToAssign.projects.push(project);
    }

    await this.usersRepository.save(userToAssign);

    if (userToAssign.organization.type === OrganizationTypes.provider) {
      //add to beneficiaryChannel, managementChannel, staffChannel if not technician, otherwise add only to staff channel
      if (checkForRoles(ProviderOrgManagementRoles, userToAssign.roles)) {
        this.chatService.addParticipantToChat(
          project.beneficiaryChannel.id,
          userToAssign.id,
        );
        this.chatService.addParticipantToChat(
          project.managementChannel.id,
          userToAssign.id,
        );
      }
      this.chatService.addParticipantToChat(
        project.staffChannel.id,
        userToAssign.id,
      );
    }
    if (userToAssign.organization.type === OrganizationTypes.beneficiary) {
      //add to beneficiaryChannel
      this.chatService.addParticipantToChat(
        project.beneficiaryChannel.id,
        userToAssign.id,
      );
    }
    //update project global updated at
    project.globalUpdatedAt = new Date();
    this.projectsRepository.save(project);

    return true;
  }

  async removeUserFromProject(
    userIdToRemove: number,
    projectId: number,
    userId: number,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);
    if (
      !checkForRole(UserRole.admin, user.roles) &&
      !checkForRole(UserRole.coordinator, user.roles)
    )
      throw new BadRequestException(ErrorTypes.USER_DOES_NOT_HAVE_A_VALID_ROLE);

    const userToRemove = await this.usersRepository.findOne({
      where: { id: userIdToRemove },
      relations: ['projects', 'organization'],
    });
    if (!userToRemove)
      throw new BadRequestException(ErrorTypes.USER_TO_ASSIGN_NOT_FOUND);

    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['beneficiaryChannel', 'managementChannel', 'staffChannel'],
    });
    if (!project) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);

    const projectToRemoveIndex = userToRemove.projects
      .map((project) => project.id)
      .indexOf(project.id);

    if (projectToRemoveIndex != -1) {
      userToRemove.projects.splice(projectToRemoveIndex, 1);
    }

    await this.usersRepository.save(userToRemove);

    if (
      userToRemove.organization.type === OrganizationTypes.beneficiary ||
      userToRemove.organization.type === OrganizationTypes.provider
    ) {
      this.chatService.setParticipant(
        project.beneficiaryChannel.id,
        userToRemove.id,
        false,
      );
      this.chatService.setParticipant(
        project.managementChannel.id,
        userToRemove.id,
        false,
      );
      this.chatService.setParticipant(
        project.staffChannel.id,
        userToRemove.id,
        false,
      );
    }
    //update project global updated at
    project.globalUpdatedAt = new Date();
    this.projectsRepository.save(project);

    return true;
  }

  async getProjectStatisticsForUser(
    page = 0,
    limit = 0,
    userId: number,
    status: ProjectStatus,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization', 'projects'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const paginationObject = buildPaginationObject(page, limit);

    let whereObject = {};

    if (checkForRole(UserRole.superAdmin, user.roles)) {
      whereObject = {};
    } else {
      if (checkForRole(UserRole.admin, user.roles)) {
        //get all projects in the users provider org
        const userOrganization = await this.organizationsRepository.findOne({
          where: { id: user.organization.id },
          relations: ['projects'],
        });
        whereObject = {
          where: {
            id: In(userOrganization.projects.map((project) => project.id)),
          },
        };
      } else {
        //get all projects that the user is assigned to
        whereObject = {
          where: {
            id: In(user.projects.map((project) => project.id)),
          },
        };
      }
    }

    if (status) {
      if (whereObject['where']) {
        whereObject['where']['status'] = status;
      } else {
        whereObject['where'] = {};
        whereObject['where']['status'] = status;
      }
    }

    const totalCount = await this.projectsRepository.count({ ...whereObject });
    const data = await this.projectsRepository.find({
      ...whereObject,
      relations: [
        'dailycheckProcedures',
        'buildings',
        'equipments',
        'mediaGalleryFiles',
      ],
      ...paginationObject,
      order: { id: 'DESC' },
    });

    let statistics = {};

    if (status === ProjectStatus.draft) {
      statistics = data.map((project) => {
        return {
          id: project.id,
          name: project.name,
          buildingsCount: project.buildings.length,
          equipmentCount: project.equipments.length,
          proceduresCount: project.dailycheckProcedures.length,
          updatedAt: project.updatedAt,
          image:
            project.mediaGalleryFiles && project.mediaGalleryFiles.length > 0
              ? project.mediaGalleryFiles[0]
              : null,
        };
      });
    }

    if (status === ProjectStatus.active) {
      statistics = data.map((project) => {
        return {
          id: project.id,
          name: project.name,
          updatedAt: project.updatedAt,
          image:
            project.mediaGalleryFiles && project.mediaGalleryFiles.length > 0
              ? project.mediaGalleryFiles[0]
              : null,
        };
      });
    }

    return {
      total: totalCount,
      data: statistics,
    };
  }

  async getProjectsForUser(page = 0, limit = 0, userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization', 'projects'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const paginationObject = buildPaginationObject(page, limit);

    let whereObject = {};

    if (checkForRole(UserRole.superAdmin, user.roles)) {
      whereObject = {};
    } else {
      if (checkForRole(UserRole.admin, user.roles)) {
        //get all projects in the users provider org
        const userOrganization = await this.organizationsRepository.findOne({
          where: { id: user.organization.id },
          relations: ['projects'],
        });
        whereObject = {
          where: {
            id: In(userOrganization.projects.map((project) => project.id)),
          },
        };
      } else {
        //get all projects that the user is assigned to
        whereObject = {
          where: {
            id: In(user.projects.map((project) => project.id)),
          },
        };
      }
    }

    const totalCount = await this.projectsRepository.count({ ...whereObject });
    const data = await this.projectsRepository.find({
      ...whereObject,
      ...paginationObject,
      order: { id: 'DESC' },
    });

    return {
      total: totalCount,
      data,
    };
  }

  async getProjectStatisticsOnlyForAssociatedProjects(
    page = 0,
    limit = 0,
    userId: number,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['projects', 'roles', 'organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const paginationObject = buildPaginationObject(page, limit);

    let whereObject: any;
    if (checkForRole(UserRole.procurement, user.roles)) {
      //get all projects in the users provider org
      const userOrganization = await this.organizationsRepository.findOne({
        where: { id: user.organization.id },
        relations: ['projects'],
      });
      whereObject = {
        where: {
          id: In(userOrganization.projects.map((project) => project.id)),
          status: ProjectStatus.active,
        },
      };
    } else {
      //get all projects that the user is assigned to
      whereObject = {
        where: {
          id: In(user.projects.map((project) => project.id)),
          status: ProjectStatus.active,
        },
      };
    }

    const totalCount = await this.projectsRepository.count({ ...whereObject });

    const data = await this.projectsRepository.find({
      ...whereObject,
      relations: ['country', 'city', 'primaryImage'],
      ...paginationObject,
      order: { id: 'DESC' },
    });

    const statistics = [];

    for (const project of data) {
      const userStats = await this.usersService.statistics(userId, project.id);
      statistics.push({
        id: project.id,
        name: project.name,
        country: project.country,
        city: project.city,
        addressOne: project.addressOne,
        addressTwo: project.addressTwo,
        procurementCount: userStats.procurementCount,
        ticketCount: userStats.ticketCount,
        primaryImage: project.primaryImage,
      });
    }

    return {
      total: totalCount,
      data: statistics,
    };
  }

  async getPublicInfo(id: number) {
    await this.checkProjectExists(id);

    const projectInfo = await this.projectsRepository.findOne({
      where: { id },
    });

    return {
      name: projectInfo.name,
    };
  }

  async findOne(id: number, userId: number) {
    await this.checkProjectExists(id);

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization', 'projects'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    let organizationProjects = null;
    if (checkForRole(UserRole.admin, user.roles)) {
      const userOrganization = await this.organizationsRepository.findOne({
        where: { id: user.organization.id },
        relations: ['projects'],
      });
      organizationProjects = userOrganization.projects;
    }

    const userHasAccess = checkIfUserHasAccessToProject(
      user,
      id,
      organizationProjects,
    );
    if (!userHasAccess) {
      throw new ForbiddenException();
    }

    let data = await this.projectsRepository.findOne({
      where: { id },
      relations: [
        'users',
        'users.organization',
        'users.roles',
        'users.avatarImage',
        // 'buildings',
        // 'buildings.levels',
        // 'buildings.levels.rooms',
        'city',
        'country',
        'generalContractorCountry',
        'generalContractorCity',
        'mediaGalleryFiles',
        'generalContractorWarrantyFiles',
        'primaryImage',
      ],
    });

    const projectOrganizationIds = [];
    data = JSON.parse(JSON.stringify(data));
    for (const user of data.users) {
      if (projectOrganizationIds.indexOf(user.organization.id) == -1) {
        projectOrganizationIds.push(user.organization.id);
      }
    }

    const organizations = await this.organizationsRepository.find({
      where: { id: In(projectOrganizationIds) },
      relations: [
        'locations',
        'locations.building',
        'locations.buildingLevel',
        'locations.buildingRooms',
      ],
    });
    data['organizations'] = organizations;
    //remove users from project, and group them by organization

    const users = data.users;
    delete data.users;
    for (let i = 0; i < data['organizations'].length; i++) {
      data['organizations'][i]['locations'] = data['organizations'][i][
        'locations'
      ].filter((location) => location.projectId == id);
      data['organizations'][i]['users'] = [];
      for (let j = 0; j < users.length; j++) {
        if (
          users[j].organization &&
          users[j].organization.id === data['organizations'][i].id
        ) {
          delete users[j].organization;
          data['organizations'][i]['users'].push(users[j]);
        }
      }
    }

    return data;
  }

  async getAssociatedOrgs(id: number, userId: number) {
    await this.checkProjectExists(id);

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization', 'projects'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    let organizationProjects = null;
    if (checkForRole(UserRole.admin, user.roles)) {
      const userOrganization = await this.organizationsRepository.findOne({
        where: { id: user.organization.id },
        relations: ['projects'],
      });
      organizationProjects = userOrganization.projects;
    }

    const userHasAccess = checkIfUserHasAccessToProject(
      user,
      id,
      organizationProjects,
    );
    if (!userHasAccess) {
      throw new ForbiddenException();
    }

    let data = await this.projectsRepository.findOne({
      where: { id },
      relations: ['users', 'users.organization'],
    });

    const projectOrganizationIds = [];
    const projectOrganizations = [];
    data = JSON.parse(JSON.stringify(data));
    for (const user of data.users) {
      if (
        projectOrganizationIds.indexOf(user.organization.id) == -1 &&
        user.organization.type != OrganizationTypes.provider
      ) {
        projectOrganizationIds.push(user.organization.id);
        projectOrganizations.push(user.organization);
      }
    }

    return {
      total: projectOrganizations.length,
      data: projectOrganizations,
    };
  }

  async getAssociatedUsers(id: number, organizationId: number, userId: number) {
    await this.checkProjectExists(id);

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization', 'projects'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    let organizationProjects = null;
    if (checkForRole(UserRole.admin, user.roles)) {
      const userOrganization = await this.organizationsRepository.findOne({
        where: { id: user.organization.id },
        relations: ['projects'],
      });
      organizationProjects = userOrganization.projects;
    }

    const userHasAccess = checkIfUserHasAccessToProject(
      user,
      id,
      organizationProjects,
    );
    if (!userHasAccess) {
      throw new ForbiddenException();
    }

    let data = await this.projectsRepository.findOne({
      where: { id },
      relations: ['users', 'users.organization'],
    });

    const projectUsers = [];
    data = JSON.parse(JSON.stringify(data));
    for (const user of data.users) {
      if (user.organization.id == organizationId) {
        projectUsers.push(user);
      }
    }

    return {
      total: projectUsers.length,
      data: projectUsers,
    };
  }

  async getAssociatedUsersByOrganizationType(
    id: number,
    organizationType: OrganizationTypes,
    userId: number,
  ) {
    await this.checkProjectExists(id);

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization', 'projects'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    let organizationProjects = null;
    if (checkForRole(UserRole.admin, user.roles)) {
      const userOrganization = await this.organizationsRepository.findOne({
        where: { id: user.organization.id },
        relations: ['projects'],
      });
      organizationProjects = userOrganization.projects;
    }

    const userHasAccess = checkIfUserHasAccessToProject(
      user,
      id,
      organizationProjects,
    );
    if (!userHasAccess) {
      throw new ForbiddenException();
    }

    let data = await this.projectsRepository.findOne({
      where: { id },
      relations: [
        'users',
        'users.organization',
        'users.roles',
        'users.avatarImage',
      ],
    });

    const projectOrganizationIds = [];
    data = JSON.parse(JSON.stringify(data));
    for (const user of data.users) {
      if (
        projectOrganizationIds.indexOf(user.organization.id) == -1 &&
        user.organization.type === organizationType
      ) {
        projectOrganizationIds.push(user.organization.id);
      }
    }

    const organizations = await this.organizationsRepository.find({
      where: { id: In(projectOrganizationIds) },
      relations: [
        'locations',
        'locations.building',
        'locations.buildingLevel',
        'locations.buildingRooms',
      ],
    });
    data['organizations'] = organizations;
    //remove users from project, and group them by organization

    const users = data.users;
    delete data.users;
    for (let i = 0; i < data['organizations'].length; i++) {
      data['organizations'][i]['locations'] = data['organizations'][i][
        'locations'
      ].filter((location) => location.projectId == id);
      data['organizations'][i]['users'] = [];
      for (let j = 0; j < users.length; j++) {
        if (
          users[j].organization &&
          users[j].organization.id === data['organizations'][i].id
        ) {
          delete users[j].organization;
          data['organizations'][i]['users'].push(users[j]);
        }
      }
    }

    return {
      total: data['organizations'].length,
      data: data['organizations'],
    };
  }

  async checkProjectExistsByName(name: string) {
    const data = await this.projectsRepository.findOne({
      where: { name },
    });
    return !!data;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto, userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization', 'projects'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    let organizationProjects = null;
    if (checkForRole(UserRole.admin, user.roles)) {
      const userOrganization = await this.organizationsRepository.findOne({
        where: { id: user.organization.id },
        relations: ['projects'],
      });
      organizationProjects = userOrganization.projects;
    }

    const userCanUpdateProject = checkIfUserHasAccessToProject(
      user,
      id,
      organizationProjects,
    );
    if (!userCanUpdateProject) throw new ForbiddenException();

    const projectData: DeepPartial<Project> = {
      ...updateProjectDto,
    };

    if (updateProjectDto.primaryImageId) {
      const primaryImage = await this.filesRepository.findOne(
        updateProjectDto.primaryImageId,
      );
      if (primaryImage) {
        projectData.primaryImage = primaryImage;
      }
    }

    if (updateProjectDto.countryId) {
      const country = await this.countriesRepository.findOne(
        updateProjectDto.countryId,
      );
      if (country) {
        projectData.country = country;
      }
    }

    if (updateProjectDto.cityId) {
      const city = await this.citiesRepository.findOne(updateProjectDto.cityId);
      if (city) {
        projectData.city = city;
      }
    }

    if (updateProjectDto.generalContractorCountryId) {
      const country = await this.countriesRepository.findOne(
        updateProjectDto.countryId,
      );
      if (country) {
        projectData.generalContractorCountry = country;
      }
    }

    if (updateProjectDto.generalContractorCityId) {
      const city = await this.citiesRepository.findOne(updateProjectDto.cityId);
      if (city) {
        projectData.generalContractorCity = city;
      }
    }

    if (updateProjectDto.generalContractorWarrantyFileIds) {
      const files = [];
      for (const fileId of updateProjectDto.generalContractorWarrantyFileIds) {
        try {
          const file = await this.filesRepository.findOne(fileId);
          if (file) {
            files.push(file);
          }
        } catch (e) {}
      }
      projectData.generalContractorWarrantyFiles = files;
    }

    if (updateProjectDto.mediaGalleryFileIds) {
      const files = [];
      for (const fileId of updateProjectDto.mediaGalleryFileIds) {
        try {
          const file = await this.filesRepository.findOne(fileId);
          if (file) {
            files.push(file);
          }
        } catch (e) {}
      }
      projectData.mediaGalleryFiles = files;
    }

    projectData['id'] = id;

    const project = await this.projectsRepository.preload(projectData);
    await this.projectsRepository.save(project);

    if (updateProjectDto.startDate) {
      await this.maintenanceProceduresService.refreshEventsOnProjectStartDateUpdate(
        project,
      );
    }
    return true;
  }

  async remove(id: number) {
    const project = await this.projectsRepository.findOne(id);
    if (!project) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);
    try {
      await this.projectsRepository.remove(project);
    } catch (e) {
      if (e.code == 23503) {
        throw new BadRequestException(
          ErrorTypes.UNABLE_TO_DELETE_PROJECT_FK_CONSTRAINT,
        );
      }
      throw new BadRequestException(ErrorTypes.UNABLE_TO_DELETE_PROJECT);
    }
    return true;
  }

  async activateProject(projectId: number, userId: number) {
    const queryRunner = await this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        relations: ['roles'],
      });
      if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

      const project = await queryRunner.manager.findOne(Project, {
        where: { id: projectId },
        relations: ['users', 'users.roles', 'users.organization'],
      });
      if (!project) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);
      if (project.status != ProjectStatus.draft)
        throw new BadRequestException(
          ErrorTypes.YOU_CAN_ACTIVATE_ONLY_PROJECTS_IN_DRAFT_STATE,
        );

      project.status = ProjectStatus.active;

      const providerManagementUsers = [];
      const providerTechnicianUsers = [];
      const beneficiaryUsers = [];

      for (const user of project.users) {
        if (user.organization.type == OrganizationTypes.beneficiary) {
          beneficiaryUsers.push(user);
        }
        if (user.organization.type == OrganizationTypes.provider) {
          if (checkForRole(UserRole.technician, user.roles)) {
            providerTechnicianUsers.push(user);
          }
          if (checkForRoles(ProviderOrgManagementRoles, user.roles)) {
            providerManagementUsers.push(user);
          }
        }
      }

      project.beneficiaryChannel = await this.chatService.create(
        queryRunner,
        [...beneficiaryUsers, ...providerManagementUsers].map(
          (user) => user.id,
        ),
        ChatTypes.beneficiaryChannel,
        `${project.name} beneficiary channel`,
      );

      project.managementChannel = await this.chatService.create(
        queryRunner,
        [...providerManagementUsers].map((user) => user.id),
        ChatTypes.managementChannel,
        `${project.name} management channel`,
      );

      project.staffChannel = await this.chatService.create(
        queryRunner,
        [...providerTechnicianUsers, ...providerManagementUsers].map(
          (user) => user.id,
        ),
        ChatTypes.staffChannel,
        `${project.name} staff channel`,
      );
      await queryRunner.manager.save(project);

      await queryRunner.commitTransaction();
      return true;
    } catch (err) {
      console.error(err);

      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new BadRequestException(err);
    } finally {
      await queryRunner.release();
    }
  }

  async refreshGlobalUpdatedAt(projectId: number) {
    const project = await this.projectsRepository.findOne(projectId);
    if (!project) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);
    project.globalUpdatedAt = new Date();
    this.projectsRepository.save(project);
    return true;
  }

  async getDashboardStatsByProjectId(projectId: number) {
    await this.checkProjectExists(projectId);

    const startOfWeek = dayjs().startOf('week').add(1, 'day');
    const endOfWeek = startOfWeek.add(6, 'day').hour(23).minute(59).second(59);

    const totalEventCount = await this.pmpEventsRepository.count({
      withDeleted: true,
      where: {
        project: { id: projectId },
        date: Between(startOfWeek.toDate(), endOfWeek.toDate()),
      },
    });

    const closedEventCount = await this.pmpEventsRepository.count({
      withDeleted: true,
      where: {
        project: { id: projectId },
        date: Between(startOfWeek.toDate(), endOfWeek.toDate()),
        status: PmpEventStatus.closed,
      },
    });

    const overdueEventCount = await this.pmpEventsRepository.count({
      withDeleted: true,
      where: {
        project: { id: projectId },
        date: LessThanOrEqual(startOfWeek.toDate()),
        status: Not(PmpEventStatus.closed),
      },
    });

    return {
      pmpStats: {
        totalEventCount,
        closedEventCount,
        overdueEventCount,
      },
    };
  }

  async getUserStatsByProjectId(projectId: number) {
    await this.checkProjectExists(projectId);

    const project = await this.projectsRepository.findOne({
      where: {
        id: projectId,
      },
      relations: ['users', 'users.organization'],
    });

    const tenantOrgs = [];
    let teamMemberCount = 0;
    let beneficiaryMemberCount = 0;

    for (const user of project.users) {
      if (user.organization.type === OrganizationTypes.provider) {
        teamMemberCount++;
      }
      if (
        user.organization.type === OrganizationTypes.tenant &&
        tenantOrgs.indexOf(user.organization.id) == -1
      ) {
        tenantOrgs.push(user.organization.id);
      }
      if (user.organization.type === OrganizationTypes.beneficiary) {
        beneficiaryMemberCount++;
      }
    }
    return {
      teamMemberCount,
      tenantMemberCount: tenantOrgs.length,
      beneficiaryMemberCount,
    };
  }
}
