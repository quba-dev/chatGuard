import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Not, Repository } from 'typeorm';
import { Role } from '../authentication/entities/role.entity';
import {
  BeneficiaryOrgRoles,
  ProviderOrgRoles,
  UserRole,
} from '../authentication/enums/user-roles.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AppConfig } from '../configuration/configuration.service';
import { Organization } from '../organizations/entities/organization.entity';
import { buildPaginationObject } from '../../util/pagination';
import { City } from '../geoLocation/entities/city.entity';
import { Country } from '../geoLocation/entities/country.entity';
import { checkForRole, checkForRoles } from '../../util/roles';
import { File } from '../files/entities/file.entity';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { checkForPresenceInProjectList } from '../../util/util';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Procurement } from '../procurements/entities/procurement.entity';
import { TicketStatus } from '../tickets/enum/ticket-status.enum';
import { EmailsService } from '../emails/emails.service';
import { ProcurementStatus } from '../procurements/enum/procurement-status.enum';
import { Project } from '../projects/entities/project.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(Country)
    private countriesRepository: Repository<Country>,
    @InjectRepository(City)
    private citiesRepository: Repository<City>,
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    @InjectRepository(Procurement)
    private procurementsRepository: Repository<Procurement>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private readonly emailsService: EmailsService,
    private config: AppConfig,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const userRecord = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (userRecord) throw new BadRequestException(ErrorTypes.EMAIL_IN_USE);

    const roles = await this.rolesRepository.find({
      name: In(createUserDto.roleNames),
    });

    const organization = await this.organizationsRepository.findOne({
      id: createUserDto.organizationId,
    });

    if (!organization)
      throw new BadRequestException(ErrorTypes.ORGANIZATION_NOT_FOUND);
    const userData: DeepPartial<User> = {
      ...createUserDto,
      roles,
      organization,
    };

    if (!userData.password) {
      const pwd = crypto.randomBytes(10).toString('hex');

      userData.isOTP = true;
      userData.password = pwd;

      await this.emailsService.sendOTP(userData.email, pwd);
    }

    if (createUserDto.countryId) {
      const country = await this.countriesRepository.findOne(
        createUserDto.countryId,
      );
      if (country) {
        userData.country = country;
      }
    }

    if (createUserDto.cityId) {
      const city = await this.citiesRepository.findOne(createUserDto.cityId);
      if (city) {
        userData.city = city;
      }
    }

    if (createUserDto.avatarImageId) {
      const file = await this.filesRepository.findOne(
        createUserDto.avatarImageId,
      );
      if (file) {
        userData.avatarImage = file;
      }
    }

    userData.password = await bcrypt.hash(userData.password, 10);
    userData.sendEmails = true;

    const user = this.usersRepository.create(userData);
    await this.usersRepository.save(user);

    return user;
  }

  async findAll(page = 0, limit = 0, userId: number) {
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
      whereObject = {
        where: { organization: user.organization },
      };
    }
    const totalCount = await this.usersRepository.count({ ...whereObject });
    const data = await this.usersRepository.find({
      ...whereObject,
      relations: ['roles', 'organization', 'city', 'country', 'avatarImage'],
      ...paginationObject,
    });
    return {
      total: totalCount,
      data,
    };
  }

  async getUsersByOrganizationId(page = 0, limit = 0, organizationId = 0) {
    const paginationObject = buildPaginationObject(page, limit);
    const organization = await this.organizationsRepository.findOne({
      id: organizationId,
    });
    if (!organization)
      throw new BadRequestException(ErrorTypes.ORGANIZATION_NOT_FOUND);

    const totalCount = await this.usersRepository.count({
      where: { organization },
    });
    const data = await this.usersRepository.find({
      where: { organization },
      relations: ['roles', 'organization', 'city', 'country', 'avatarImage'],
      ...paginationObject,
      order: { id: 'DESC' },
    });
    return {
      total: totalCount,
      data,
    };
  }

  async findOne(id: number, initiatorUserId: number) {
    let isAllowed = id == initiatorUserId;
    if (!isAllowed) {
      const initiatorUser = await this.usersRepository.findOne({
        where: { id: initiatorUserId },
        relations: ['roles'],
      });
      if (!initiatorUser)
        throw new BadRequestException(ErrorTypes.INITIATOR_USER_NOT_FOUND);

      if (checkForRoles(ProviderOrgRoles, initiatorUser.roles))
        isAllowed = true;
    }
    if (!isAllowed) throw new ForbiddenException();

    const userData = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles', 'organization', 'city', 'country', 'avatarImage'],
    });

    return {
      ...userData.toJSON(),
      projectCount: userData.projectIds.length,
    };
  }

  async statistics(id: number, projectId: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['projects', 'roles', 'organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    if (
      !checkForPresenceInProjectList(projectId, user.projects) &&
      !checkForRole(UserRole.procurement, user.roles)
    )
      throw new BadRequestException(ErrorTypes.USER_NOT_FOUND_IN_PROJECT);

    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ['users', 'users.organization'],
    });

    //get all procurements created for those users
    const assignedUsersFromRecipientOrg = project.users
      .filter(
        (projectUser: User) =>
          projectUser.organization.id === user.organization.id,
      )
      .map((projectUser) => projectUser.id);

    let ticketCount = 0;
    if (!checkForRole(UserRole.procurement, user.roles)) {
      let ticketCountExtraConditions: any = {
        recipient: { id: In(assignedUsersFromRecipientOrg) },
      };
      if (checkForRoles([...BeneficiaryOrgRoles], user.roles)) {
        ticketCountExtraConditions = {};
      }

      ticketCount = await this.ticketsRepository.count({
        where: {
          project: { id: projectId },
          status: Not(TicketStatus.closed),
          ...ticketCountExtraConditions,
        },
      });
    }

    let procurementCountExtraConditions: any = {
      recipient: { id: In(assignedUsersFromRecipientOrg) },
      status: Not(ProcurementStatus.closed),
    };

    if (checkForRole(UserRole.procurement, user.roles)) {
      procurementCountExtraConditions = {
        status: Not(In([ProcurementStatus.closed, ProcurementStatus.new])),
      };
    }

    const procurementCount = await this.procurementsRepository.count({
      where: {
        project: { id: projectId },
        ...procurementCountExtraConditions,
      },
    });

    return {
      ticketCount,
      procurementCount,
    };
  }

  async findOneByEmail(email: string) {
    return await this.usersRepository.findOne({
      where: { email },
      relations: ['roles', 'organization', 'city', 'country'],
    });
  }

  async updateLastSeen(id: number) {
    await this.usersRepository.update({ id }, { lastSeen: dayjs().toDate() });
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    initiatorUserId: number,
  ) {
    let isAllowed = id == initiatorUserId;

    const initiatorUser = await this.usersRepository.findOne({
      where: { id: initiatorUserId },
      relations: ['roles'],
    });
    if (!initiatorUser)
      throw new BadRequestException(ErrorTypes.INITIATOR_USER_NOT_FOUND);

    if (checkForRoles(ProviderOrgRoles, initiatorUser.roles)) isAllowed = true;
    if (!isAllowed) throw new ForbiddenException();

    if (updateUserDto.password) {
      if (
        checkForRole(UserRole.admin, initiatorUser.roles) ||
        checkForRole(UserRole.superAdmin, initiatorUser.roles) ||
        id === initiatorUserId
      ) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      } else {
        delete updateUserDto.password;
      }
    }

    const userData: DeepPartial<User> = {
      ...updateUserDto,
    };

    if (updateUserDto.roleNames) {
      if (
        (checkForRole(UserRole.admin, initiatorUser.roles) &&
          updateUserDto.roleNames.indexOf(UserRole.superAdmin)) == -1 ||
        (checkForRole(UserRole.coordinator, initiatorUser.roles) &&
          updateUserDto.roleNames.indexOf(UserRole.superAdmin) == -1 &&
          updateUserDto.roleNames.indexOf(UserRole.admin) == -1)
      ) {
        const roles = await this.rolesRepository.find({
          name: In(updateUserDto.roleNames),
        });
        userData['roles'] = roles;
      }
    }

    userData['id'] = id;

    if (updateUserDto.countryId) {
      const country = await this.countriesRepository.findOne(
        updateUserDto.countryId,
      );
      if (country) {
        userData.country = country;
      }
    }

    if (updateUserDto.cityId) {
      const city = await this.citiesRepository.findOne(updateUserDto.cityId);
      if (city) {
        userData.city = city;
      }
    }

    if (typeof updateUserDto.avatarImageId !== 'undefined') {
      if (updateUserDto.avatarImageId) {
        const file = await this.filesRepository.findOne(
          updateUserDto.avatarImageId,
        );
        if (file) {
          userData.avatarImage = file;
        }
      } else userData.avatarImage = null;
    }

    if (updateUserDto.sendEmails) {
      userData.sendEmails = updateUserDto.sendEmails;
    }

    const userDB = await this.usersRepository.preload(userData);
    return await this.usersRepository.save(userDB);
  }

  async remove(id: number) {
    try {
      const user = await this.usersRepository.findOne(id);
      if (!user) {
        throw new Error();
      }
      await this.usersRepository.remove(user);
    } catch (e) {
      if (e.code == 23503) {
        throw new BadRequestException(
          ErrorTypes.UNABLE_TO_DELETE_USER_FK_CONSTRAINT,
        );
      }
      throw new BadRequestException(ErrorTypes.UNABLE_TO_DELETE_USER);
    }
    return true;
  }

  async changePassword(changePasswordDto: ChangePasswordDto, tokenData: any) {
    const user = await this.findOneByEmail(tokenData.email);
    if (
      user &&
      (await bcrypt.compare(changePasswordDto.oldPassword, user.password))
    ) {
      user.isOTP = false;
      user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
      this.usersRepository.save(user);
      return true;
    }
    throw new ForbiddenException();
  }

  //-----------------------------------------------------------------

  async createInitialUsers() {
    const findSuperAdmin = await this.usersRepository
      .createQueryBuilder()
      .from(User, 'user')
      .innerJoin(
        'user_roles_role',
        'user_roles_role',
        'user_roles_role.userId = user.id',
      )
      .innerJoin('role', 'role', 'user_roles_role.roleId = role.id')
      .where('role.name= :name', { name: UserRole.superAdmin })
      .getRawOne();

    if (!findSuperAdmin) {
      const superAdmin = new User();
      const superAdminRole = await this.rolesRepository.findOne({
        name: UserRole.superAdmin,
      });

      superAdmin.roles = [superAdminRole];
      superAdmin.password = await bcrypt.hash('1234', 10);
      superAdmin.firstName = 'super';
      superAdmin.lastName = 'admin';
      superAdmin.email = 'super@admin.com';
      await this.usersRepository.save(superAdmin);
    }
  }
}
