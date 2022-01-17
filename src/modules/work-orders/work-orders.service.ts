import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subject } from 'rxjs';
import { buildPaginationObject } from '../../util/pagination';
import { checkForRole, checkForRoles } from '../../util/roles';
import { DeepPartial, In, Repository } from 'typeorm';
import { UserRole } from '../authentication/enums/user-roles.enum';
import { BuildingLevel } from '../buildings/entities/building-level.entity';
import { BuildingRoom } from '../buildings/entities/building-room.entity';
import { Building } from '../buildings/entities/building.entity';
import { AppConfig } from '../configuration/configuration.service';
import { Equipment } from '../equipments/entities/equipment.entity';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { Organization } from '../organizations/entities/organization.entity';
import { Procurement } from '../procurements/entities/procurement.entity';
import { Project } from '../projects/entities/project.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { User } from '../users/entities/user.entity';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderStatus } from './enum/work-order-status.enum';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Building)
    private buildingsRepository: Repository<Building>,
    @InjectRepository(BuildingLevel)
    private buildingLevelsRepository: Repository<BuildingLevel>,
    @InjectRepository(BuildingRoom)
    private buildingRoomsRepository: Repository<BuildingRoom>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    @InjectRepository(Equipment)
    private equipmentsRepository: Repository<Equipment>,
    @InjectRepository(Procurement)
    private procurementsRepository: Repository<Procurement>,
    @InjectRepository(WorkOrder)
    private workOrdersRepository: Repository<WorkOrder>,
    private config: AppConfig,
  ) {}

  async create(createWorkOrderDto: CreateWorkOrderDto) {
    const workOrderData: DeepPartial<WorkOrder> = {
      ...createWorkOrderDto,
    };

    const project = await this.projectsRepository.findOne(
      createWorkOrderDto.projectId,
    );
    if (!project) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);
    workOrderData.project = project;

    if (createWorkOrderDto.buildingId) {
      const building = await this.buildingsRepository.findOne(
        createWorkOrderDto.buildingId,
      );
      if (!building)
        throw new BadRequestException(ErrorTypes.BUILDING_NOT_FOUND);
      workOrderData.building = building;
    }

    if (createWorkOrderDto.buildingLevelId) {
      const buildingLevel = await this.buildingLevelsRepository.findOne(
        createWorkOrderDto.buildingLevelId,
      );
      if (!buildingLevel)
        throw new BadRequestException(ErrorTypes.BUILDING_LEVEL_NOT_FOUND);
      workOrderData.buildingLevel = buildingLevel;
    }

    if (createWorkOrderDto.buildingRoomIds) {
      const buildingRooms = await this.buildingRoomsRepository.find({
        where: { id: In(createWorkOrderDto.buildingRoomIds) },
        relations: ['level'],
      });
      if (
        !buildingRooms ||
        buildingRooms.length != createWorkOrderDto.buildingRoomIds.length
      )
        throw new BadRequestException(ErrorTypes.BUILDING_ROOM_NOT_FOUND);

      for (const room of buildingRooms) {
        if (room.level.id != workOrderData.buildingLevel.id)
          throw new BadRequestException(
            ErrorTypes.BUILDING_ROOM_IS_NOT_PART_OF_BUILDING,
          );
      }
      workOrderData.buildingRooms = buildingRooms;
    }

    if (createWorkOrderDto.userIds) {
      const users = [];
      for (const userId of createWorkOrderDto.userIds) {
        const user = await this.usersRepository.findOne({
          where: { id: userId },
        });
        if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);
        users.push(user);
      }
      workOrderData.users = users;
    }

    if (createWorkOrderDto.ticketIds) {
      const tickets = [];
      for (const ticketId of createWorkOrderDto.ticketIds) {
        const ticket = await this.ticketsRepository.findOne({
          where: { id: ticketId },
        });
        if (!ticket) throw new BadRequestException(ErrorTypes.TICKET_NOT_FOUND);
        tickets.push(ticket);
      }
      workOrderData.tickets = tickets;
    }

    if (createWorkOrderDto.procurementOrderIds) {
      const procurementOrders = [];
      for (const procurementId of createWorkOrderDto.procurementOrderIds) {
        const procurementOrder = await this.procurementsRepository.findOne({
          where: { id: procurementId },
        });
        if (!procurementOrder)
          throw new BadRequestException(ErrorTypes.PROCUREMENT_NOT_FOUND);
        procurementOrders.push(procurementOrder);
      }
      workOrderData.procurementOrders = procurementOrders;
    }

    if (createWorkOrderDto.equipmentIds) {
      const equipments = [];
      for (const equipmentId of createWorkOrderDto.equipmentIds) {
        const equipment = await this.equipmentsRepository.findOne({
          where: { id: equipmentId },
        });
        if (!equipment)
          throw new BadRequestException(ErrorTypes.EQUIPMENT_NOT_FOUND);
        equipments.push(equipment);
      }
      workOrderData.equipments = equipments;
    }

    const workOrder = this.workOrdersRepository.create(workOrderData);
    await this.workOrdersRepository.save(workOrder);

    return workOrder;
  }

  async update(id: number, updateWorkOrderDto: UpdateWorkOrderDto) {
    const workOrder = await this.workOrdersRepository.findOne({
      where: { id },
      relations: ['buildingLevel'],
    });
    if (!workOrder)
      throw new BadRequestException(ErrorTypes.WORK_ORDER_NOT_FOUND);

    //-------------------------------------
    //update status
    if (updateWorkOrderDto.status) workOrder.status = updateWorkOrderDto.status;
    //-------------------------------------

    if (updateWorkOrderDto.subject)
      workOrder.subject = updateWorkOrderDto.subject;

    if (updateWorkOrderDto.description)
      workOrder.description = updateWorkOrderDto.description;

    if (updateWorkOrderDto.dueDate)
      workOrder.dueDate = updateWorkOrderDto.dueDate;

    if (updateWorkOrderDto.buildingId) {
      const building = await this.buildingsRepository.findOne(
        updateWorkOrderDto.buildingId,
      );
      if (!building)
        throw new BadRequestException(ErrorTypes.BUILDING_NOT_FOUND);
      workOrder.building = building;
    }

    if (updateWorkOrderDto.buildingLevelId) {
      const buildingLevel = await this.buildingLevelsRepository.findOne(
        updateWorkOrderDto.buildingLevelId,
      );
      if (!buildingLevel)
        throw new BadRequestException(ErrorTypes.BUILDING_LEVEL_NOT_FOUND);
      workOrder.buildingLevel = buildingLevel;
    }

    if (updateWorkOrderDto.buildingRoomIds) {
      const buildingRooms = await this.buildingRoomsRepository.find({
        where: { id: In(updateWorkOrderDto.buildingRoomIds) },
        relations: ['level'],
      });
      if (
        !buildingRooms ||
        buildingRooms.length != updateWorkOrderDto.buildingRoomIds.length
      )
        throw new BadRequestException(ErrorTypes.BUILDING_ROOM_NOT_FOUND);

      for (const room of buildingRooms) {
        if (room.level.id != workOrder.buildingLevel.id)
          throw new BadRequestException(
            ErrorTypes.BUILDING_ROOM_IS_NOT_PART_OF_BUILDING,
          );
      }
      workOrder.buildingRooms = buildingRooms;
    }

    if (updateWorkOrderDto.userIds) {
      const users = [];
      for (const userId of updateWorkOrderDto.userIds) {
        const user = await this.usersRepository.findOne({
          where: { id: userId },
        });
        if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);
        users.push(user);
      }
      workOrder.users = users;
    }

    if (updateWorkOrderDto.ticketIds) {
      const tickets = [];
      for (const ticketId of updateWorkOrderDto.ticketIds) {
        const ticket = await this.ticketsRepository.findOne({
          where: { id: ticketId },
        });
        if (!ticket) throw new BadRequestException(ErrorTypes.TICKET_NOT_FOUND);
        tickets.push(ticket);
      }
      workOrder.tickets = tickets;
    }

    if (updateWorkOrderDto.procurementOrderIds) {
      const procurementOrders = [];
      for (const procurementId of updateWorkOrderDto.procurementOrderIds) {
        const procurementOrder = await this.procurementsRepository.findOne({
          where: { id: procurementId },
        });
        if (!procurementOrder)
          throw new BadRequestException(ErrorTypes.PROCUREMENT_NOT_FOUND);
        procurementOrders.push(procurementOrder);
      }
      workOrder.procurementOrders = procurementOrders;
    }

    if (updateWorkOrderDto.equipmentIds) {
      const equipments = [];
      for (const equipmentId of updateWorkOrderDto.equipmentIds) {
        const equipment = await this.equipmentsRepository.findOne({
          where: { id: equipmentId },
        });
        if (!equipment)
          throw new BadRequestException(ErrorTypes.EQUIPMENT_NOT_FOUND);
        equipments.push(equipment);
      }
      workOrder.equipments = equipments;
    }

    await this.workOrdersRepository.save(workOrder);

    return true;
  }

  async remove(id: number) {
    const workOrder = await this.workOrdersRepository.findOne(id);
    if (!workOrder)
      throw new BadRequestException(ErrorTypes.WORK_ORDER_NOT_FOUND);

    this.workOrdersRepository.remove(workOrder);
    return true;
  }

  async getWorkOrdersForUserByProjectId(
    page = 0,
    limit = 0,
    userId: number,
    projectId: number,
    status: WorkOrderStatus,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'workOrders'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const paginationObject = buildPaginationObject(page, limit);

    const whereObject = {
      where: {
        project: { id: projectId },
      },
    };

    if (
      checkForRoles(
        [
          UserRole.admin,
          UserRole.coordinator,
          UserRole.projectManager,
          UserRole.assistantProjectManager,
          UserRole.superAdmin,
        ],
        user.roles,
      )
    ) {
      //no extra conditions, return all work orders in project
    } else {
      //get all users associated to project in the user's org
      whereObject['where']['id'] = In(user.workOrders.map((wo) => wo.id));
    }

    if (status) {
      whereObject['where']['status'] = status;
    }

    const totalCount = await this.workOrdersRepository.count({
      ...whereObject,
    });
    const data = await this.workOrdersRepository.find({
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
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'workOrders'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    let userHasAccess = false;
    if (
      checkForRoles(
        [
          UserRole.admin,
          UserRole.coordinator,
          UserRole.projectManager,
          UserRole.assistantProjectManager,
          UserRole.superAdmin,
        ],
        user.roles,
      )
    ) {
      userHasAccess = true;
    } else {
      if (user.workOrders.map((wo) => wo.id).indexOf(id) > -1)
        userHasAccess = true;
    }

    if (!userHasAccess) throw new ForbiddenException();

    const workOrder = await this.workOrdersRepository.findOne({
      where: { id },
      relations: [
        'users',
        'equipments',
        'tickets',
        'procurementOrders',
        'building',
        'buildingLevel',
        'buildingRooms',
      ],
    });
    if (!workOrder)
      throw new BadRequestException(ErrorTypes.WORK_ORDER_NOT_FOUND);

    return workOrder;
  }
}
