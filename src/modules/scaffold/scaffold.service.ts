import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { ProjectsService } from '../projects/projects.service';
import * as dayjs from 'dayjs';
import { CreateProjectDto } from '../projects/dto/create-project.dto';
import { BuildingsService } from '../buildings/buildings.service';
import { BuildingLevelsService } from '../buildings/building-levels.service';
import { BuildingRoomsService } from '../buildings/building-rooms.service';
import { EquipmentsService } from '../equipments/equipments.service';
import { EquipmentProjectCategoriesService } from '../equipments/equipment-project-categories.service';
import { EquipmentCategoryGroupsService } from '../equipments/equipment-category-groups.service';
import { EquipmentModelsService } from '../equipments/equipment-models.service';
import { ManufacturersService } from '../equipments/manufacturers.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { StandardProceduresService } from '../standard-procedures/standard-procedures.service';
import { UsersService } from '../users/users.service';
import { CreateOrganizationDto } from '../organizations/dto/create-organization.dto';
import { DeepPartial, In, Repository } from 'typeorm';
import { OrganizationTypes } from '../organizations/enums/organization-types.enum';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../authentication/enums/user-roles.enum';
import { Organization } from '../organizations/entities/organization.entity';
import { Role } from '../authentication/entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { StandardCategoriesService } from '../standard-procedures/standard-categories.service';
import { StandardCategoryGroupsService } from '../standard-procedures/standard-category-groups.service';

@Injectable()
export class ScaffoldService {
  constructor(
    private readonly projectService: ProjectsService,
    private readonly userService: UsersService,
    private readonly buildingService: BuildingsService,
    private readonly buildingLevelService: BuildingLevelsService,
    private readonly buildingRoomService: BuildingRoomsService,
    private readonly equipmentService: EquipmentsService,
    private readonly equipmentProjectCategoriesService: EquipmentProjectCategoriesService,
    private readonly equipmentCategoryGroupsService: EquipmentCategoryGroupsService,
    private readonly equipmentModelsService: EquipmentModelsService,
    private readonly equipmentManufacturersService: ManufacturersService,
    private readonly organizationsService: OrganizationsService,
    private readonly standardProceduresService: StandardProceduresService,
    private readonly standardCategoryGroupsService: StandardCategoryGroupsService,
    private readonly standardCategoriesService: StandardCategoriesService,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  randomIntFromInterval(min: number, max: number) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  async createTestProject() {
    const buildingName = 'GW Tower';
    const buildingInfo = {};
    if (await this.projectService.checkProjectExistsByName(buildingName)) {
      return;
    }

    const content = readFileSync(
      'src/modules/scaffold/data/project.json',
      'utf-8',
    );
    const projectObj = JSON.parse(content);

    const categoriesInfo = [];
    for (const item of projectObj) {
      if (!buildingInfo[item['Floor']]) {
        buildingInfo[item['Floor']] = {};
      }

      if (!buildingInfo[item['Floor']][item['Space']]) {
        buildingInfo[item['Floor']][item['Space']] = {
          equipment: [],
        };
      }

      buildingInfo[item['Floor']][item['Space']]['equipment'].push({
        name: item['Asset Description'],
        group: item['Asset Reference'],
      });

      if (categoriesInfo.indexOf(item['Asset Reference']) == -1) {
        categoriesInfo.push(item['Asset Reference']);
      }
    }

    const createProjectDTO: CreateProjectDto = new CreateProjectDto();
    createProjectDTO.name = buildingName;
    createProjectDTO.startDate = dayjs('2021-10-1').toDate();

    try {
      const organization = await this.organizationsService.findOneByName(
        'Coral DMOB',
      );
      if (!organization) return;

      const user = await this.userService.findOneByEmail('admin@coraldmob.com');
      const userId = user.id;

      const models = await this.equipmentModelsService.findAll(userId);
      let equipmentModel = null;
      if (models.total == 0) {
        equipmentModel = await this.equipmentModelsService.create(
          'test model',
          userId,
        );
      } else {
        equipmentModel = models.data[0];
      }

      const manufacturers = await this.equipmentManufacturersService.findAll(
        userId,
      );
      let equipmentManufacturer = null;
      if (manufacturers.total == 0) {
        equipmentManufacturer = await this.equipmentManufacturersService.create(
          'test manufacturer',
          userId,
        );
      } else {
        equipmentManufacturer = manufacturers.data[0];
      }

      const standardCategories =
        await this.standardCategoriesService.getStandardEquipmentCategories(
          organization.id,
        );
      if (standardCategories.total == 0) return;

      const standardCategoryGroups =
        await this.standardCategoryGroupsService.getStandardEquipmentCategoryGroupsByCategory(
          standardCategories.data[0].id,
        );
      if (standardCategoryGroups.total == 0) return;

      const project = await this.projectService.create(
        createProjectDTO,
        userId,
      );

      //create aux orgs
      const auxOrgs = [
        {
          name: 'Beneficiary',
          type: OrganizationTypes.beneficiary,
          roleName: 'buildingManager',
        },

        {
          name: 'Tenant1',
          type: OrganizationTypes.tenant,
          roleName: 'officeManager',
        },

        {
          name: 'Tenant2',
          type: OrganizationTypes.tenant,
          roleName: 'officeManager',
        },

        {
          name: 'Tenant3',
          type: OrganizationTypes.tenant,
          roleName: 'officeManager',
        },
      ];

      for (const orgData of auxOrgs) {
        let org = await this.organizationsService.findOneByName(orgData.name);
        if (!org) {
          org = await this.organizationsService.create(
            {
              name: orgData.name,
              type: orgData.type,
              parentOrganizationId: organization.id,
            },
            userId,
          );

          const roles = await this.rolesRepository.find({
            where: { name: In([orgData.roleName]) },
          });

          const user = new User();
          user.organization = org;
          user.email = `${orgData.name.toLowerCase()}@${orgData.name.toLowerCase()}.com`;
          user.password = await bcrypt.hash('1234', 10);
          user.firstName = orgData.name;
          user.lastName = 'Default';
          user.roles = roles;

          await this.usersRepository.save(user);

          await this.projectService.assignUserToProject(
            user.id,
            project.id,
            userId,
          );
        }
      }

      const extraUsers = [
        {
          name: 'Coordinator',
          roleName: 'coordinator',
        },
        {
          name: 'Project Manager',
          roleName: 'projectManager',
        },
        {
          name: 'Assistant Project Manager',
          roleName: 'assistantProjectManager',
        },
        {
          name: 'Procurement',
          roleName: 'procurement',
        },
        {
          name: 'Technician1',
          roleName: 'technician',
        },
        {
          name: 'Technician2',
          roleName: 'technician',
        },
        {
          name: 'Technician3',
          roleName: 'technician',
        },
      ];

      for (const userData of extraUsers) {
        const email = `${userData.name
          .replace(/\s+/g, '')
          .toLowerCase()}@${organization.name
          .replace(/\s+/g, '')
          .toLowerCase()}.com`;
        const user = await this.usersRepository.findOne({ where: { email } });

        if (!user) {
          const roles = await this.rolesRepository.find({
            where: { name: In([userData.roleName]) },
          });

          const user = new User();
          user.organization = organization;
          user.email = email;
          user.password = await bcrypt.hash('1234', 10);
          user.firstName = userData.name;
          user.lastName = 'Default';
          user.roles = roles;

          await this.usersRepository.save(user);

          await this.projectService.assignUserToProject(
            user.id,
            project.id,
            userId,
          );
        }
      }

      const eqProjectCategories =
        await this.equipmentProjectCategoriesService.findAll(project.id);
      const eqCategoryGroups = {};
      for (const categoryInfo of categoriesInfo) {
        const eqProjectCategory =
          eqProjectCategories.data[
            this.randomIntFromInterval(0, eqProjectCategories.total - 1)
          ];
        const eqCategoryGroup =
          await this.equipmentCategoryGroupsService.create(
            eqProjectCategory.id,
            categoryInfo,
          );

        eqCategoryGroups[categoryInfo] = {
          projectCategoryId: eqProjectCategory.id,
          equipmentCategoryGroup: eqCategoryGroup.id,
        };
      }

      const building = await this.buildingService.create({
        projectId: project['id'],
        name: buildingName,
        levels: [],
      });

      for (const [floorName, rooms] of Object.entries(buildingInfo)) {
        const level = await this.buildingLevelService.create({
          buildingId: building.id,
          name: floorName,
          isSubLevel: false,
          rooms: [],
        });
        for (const [roomName, roomInfo] of Object.entries(rooms)) {
          const room = await this.buildingRoomService.create({
            levelId: level['id'],
            name: roomName,
            description: roomName,
          });

          for (const eqInfo of roomInfo.equipment) {
            const eq = await this.equipmentService.create({
              name: eqInfo.name,
              buildingId: building.id,
              buildingLevelId: level['id'],
              buildingRoomId: room['id'],
              documentationFileIds: [],
              equipmentCategoryGroupId:
                eqCategoryGroups[eqInfo.group].equipmentCategoryGroup,
              equipmentModelId: equipmentModel.id,
              inputs: [],
              manufacturerId: equipmentManufacturer.id,
              mediaFileIds: [],
              projectId: project.id,
              quantity: 1,
              standardCategoryGroupId: standardCategoryGroups.data[0].id,
            });
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  async createGWProject() {}
}
