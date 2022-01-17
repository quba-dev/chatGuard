import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Connection,
  DeepPartial,
  ILike,
  In,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Raw,
  Repository,
} from 'typeorm';
import * as uniq from 'lodash/uniq';

import { BuildingLevel } from '../buildings/entities/building-level.entity';
import { BuildingRoom } from '../buildings/entities/building-room.entity';
import { Building } from '../buildings/entities/building.entity';
import { ChatService } from '../chat/chat.service';
import { AppConfig } from '../configuration/configuration.service';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { File } from '../files/entities/file.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import {
  checkForRole,
  checkForRoles,
  checkIfUserHasAccessToProject,
} from '../../util/roles';
import {
  BeneficiaryOrgRoles,
  ProviderOrgRoles,
  TenantOrgRoles,
  UserRole,
} from '../authentication/enums/user-roles.enum';
import { MessageTypes } from '../chat/enums/message-types.enum';
import { TicketStatus } from './enum/ticket-status.enum';
import { buildPaginationObject } from '../../util/pagination';
import { ChatTypes } from '../chat/enums/chat-types.enum';
import { OrganizationTypes } from '../organizations/enums/organization-types.enum';
import { UpdateResolvedDto } from './dto/update-resolved.dto';
import { AddMessageDto } from '../chat/dto/add-message.dto';
import { Chat } from '../chat/entities/chat.entity';
import { buildOrderObject } from '../../util/order';
import { TicketPriority } from './enum/ticket-priority.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationTypes } from '../notifications/enums/notification-types.enum';
import { ChatParticipant } from '../chat/entities/chat-participant.entity';
import * as dayjs from 'dayjs';
import { buildIntervalFilter } from '../../util/filter';
import { TICKET_NOTIFICATION } from '../../websocket/events';

@Injectable()
export class TicketsService {
  constructor(
    private connection: Connection,
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
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
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    @InjectRepository(ChatParticipant)
    private chatParticipantsRepository: Repository<ChatParticipant>,
    @InjectRepository(Chat)
    private chatsRepository: Repository<Chat>,
    private readonly notificationsService: NotificationsService,
    private readonly chatService: ChatService,
    private config: AppConfig,
  ) {}

  async create(createTicketDto: CreateTicketDto, userId: number) {
    const queryRunner = await this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const creatingUser = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        relations: ['organization', 'roles'],
      });
      if (!creatingUser)
        throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

      let recipientUser = creatingUser;

      if (checkForRoles([...ProviderOrgRoles], creatingUser.roles)) {
        if (typeof createTicketDto.recipientId == 'undefined')
          throw new BadRequestException(
            ErrorTypes.TICKET_RECIPIENT_MUST_BE_SET,
          );
        recipientUser = await queryRunner.manager.findOne(User, {
          where: { id: createTicketDto.recipientId },
          relations: ['organization', 'roles'],
        });
        if (!recipientUser)
          throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);
        if (
          recipientUser.organization.type != OrganizationTypes.beneficiary &&
          recipientUser.organization.type != OrganizationTypes.tenant
        ) {
          throw new BadRequestException(
            ErrorTypes.TICKET_INVALID_ORGANIZATION_TYPE,
          );
        }
      }

      const ticketData: DeepPartial<Ticket> = {
        ...createTicketDto,
        creator: creatingUser,
        recipient: recipientUser,
      };
      const ticket: Ticket = this.ticketsRepository.create(ticketData);

      const project = await queryRunner.manager.findOne(Project, {
        where: { id: createTicketDto.projectId },
        relations: ['users', 'users.roles'],
      });
      if (!project) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);
      ticket.project = project;

      if (createTicketDto.buildingId) {
        const building = await queryRunner.manager.findOne(
          Building,
          createTicketDto.buildingId,
        );
        if (!building)
          throw new BadRequestException(ErrorTypes.BUILDING_NOT_FOUND);
        ticket.building = building;
      }

      if (createTicketDto.buildingLevelId) {
        const buildingLevel = await queryRunner.manager.findOne(
          BuildingLevel,
          createTicketDto.buildingLevelId,
        );
        if (!buildingLevel)
          throw new BadRequestException(ErrorTypes.BUILDING_LEVEL_NOT_FOUND);
        ticket.buildingLevel = buildingLevel;
      }

      if (createTicketDto.buildingRoomIds) {
        const buildingRooms = await queryRunner.manager.find(BuildingRoom, {
          where: { id: In(createTicketDto.buildingRoomIds) },
          relations: ['level'],
        });
        if (
          !buildingRooms ||
          buildingRooms.length !== createTicketDto.buildingRoomIds.length
        )
          throw new BadRequestException(ErrorTypes.BUILDING_ROOM_NOT_FOUND);

        for (const room of buildingRooms) {
          if (room.level.id != ticket.buildingLevel.id)
            throw new BadRequestException(
              ErrorTypes.BUILDING_ROOM_IS_NOT_PART_OF_BUILDING,
            );
        }
        ticket.buildingRooms = buildingRooms;
      }

      // NOTES
      // beneficiary or tenant
      // add opening user + project manager
      // for organization only project manager
      // add project manager + who the ticket is for ?
      const externalParticipantIds: number[] = [];
      const internalParticipantIds: number[] = [];

      // if ticket is created by an admin, add the admin as well
      if (checkForRole(UserRole.admin, creatingUser.roles)) {
        externalParticipantIds.push(creatingUser.id);
        internalParticipantIds.push(creatingUser.id);
      }

      // add coord, pm, apm by default to internal and external chats
      for (const projectUser of project.users) {
        if (
          checkForRoles(
            [
              UserRole.coordinator,
              UserRole.projectManager,
              UserRole.assistantProjectManager,
            ],
            projectUser.roles,
          )
        ) {
          externalParticipantIds.push(projectUser.id);
          internalParticipantIds.push(projectUser.id);
        }
      }

      // if ticket is created by a beneficiary or tenant user add the creator to external chat
      if (
        checkForRoles(
          [...BeneficiaryOrgRoles, ...TenantOrgRoles],
          creatingUser.roles,
        )
      ) {
        externalParticipantIds.push(creatingUser.id);
      }

      // if ticket is created by a coord, pm or apm the recipient user is added to external chat
      if (
        checkForRoles(
          [
            UserRole.admin,
            UserRole.coordinator,
            UserRole.projectManager,
            UserRole.assistantProjectManager,
          ],
          creatingUser.roles,
        )
      ) {
        externalParticipantIds.push(recipientUser.id);
      }

      ticket.externalChat = await this.chatService.create(
        queryRunner,
        externalParticipantIds,
        ChatTypes.external,
      );
      ticket.internalChat = await this.chatService.create(
        queryRunner,
        internalParticipantIds,
        ChatTypes.internal,
      );

      const files = [];
      if (createTicketDto.fileIds) {
        for (const fileUuid of createTicketDto.fileIds) {
          files.push({ uuid: fileUuid });
        }
      }
      await this.chatService.addMessageTx(
        queryRunner,
        { message: createTicketDto.description, files },
        MessageTypes.userNewTicket,
        ticket.externalChat.id,
        creatingUser.id,
        {
          subject: createTicketDto.subject,
        },
      );

      const ticketRecord = await queryRunner.manager.save(ticket);

      const priority = TicketPriority[ticketRecord.priority];
      const userIds = [...externalParticipantIds, ...internalParticipantIds];
      const uniqUserIds: number[] = uniq(userIds);

      for (const consumerId of uniqUserIds) {
        const metadata = {
          ticketId: ticketRecord.id,
          creatorFirstName: creatingUser.firstName,
          creatorLastName: creatingUser.lastName,
          priority: priority,
          status: ticketRecord.status,
          statusNotification: NotificationTypes.ticketCreated,
          projectId: ticketRecord.projectId,
          ticketSubject: ticketRecord.subject,
        };

        if (consumerId !== userId) {
          const createdNotification = await this.notificationsService.createTx(
            queryRunner,
            userId,
            consumerId,
            NotificationTypes.ticketCreated,
            metadata,
          );

          const notificationResponse =
            this.notificationsService.composeNotificationResponse(
              createdNotification,
            );

          await this.notificationsService.sendWebsocketNotificationByUserId(
            consumerId,
            TICKET_NOTIFICATION,
            notificationResponse,
          );
        }
      }
      await queryRunner.commitTransaction();

      return ticketRecord;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new BadRequestException(err);
    } finally {
      await queryRunner.release();
    }
  }

  async getTicketsForUserByProjectId(
    page = 0,
    limit = 0,
    userId: number,
    projectId: number,
    status: TicketStatus,
    orgType: string,
    order: string,
    filter: string,
    search: string,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const paginationObject = buildPaginationObject(page, limit);
    const orderObject = buildOrderObject(
      order,
      ['priority', 'subject', 'openedAt', 'updatedAt', 'dueDate'],
      { id: 'DESC' },
    );

    const searchObject = {};
    if (search) {
      searchObject['subject'] = ILike(`%${search}%`);
    }

    const myRegexp =
      /(organization:(?<orgFilter>.*?),)?(opened:(?<openedStart>.*?)_(?<openedEnd>.*?),)?(updated:(?<updatedStart>.*?)_(?<updatedEnd>.*?),)?(dueDate:(?<dueDateStart>.*?)_(?<dueDateEnd>.*?),)?/g;
    // this delimiter is needed at the end of the string
    filter += ',';
    const ticketsFilterObj = myRegexp.exec(filter).groups;

    let openedObject = {};
    if (ticketsFilterObj.openedStart) {
      [openedObject] = buildIntervalFilter(
        ticketsFilterObj.openedStart,
        ticketsFilterObj.openedEnd,
        'openedAt',
      );
    }

    let updatedObject = {};
    if (ticketsFilterObj.updatedStart) {
      [updatedObject] = buildIntervalFilter(
        ticketsFilterObj.updatedStart,
        ticketsFilterObj.updatedEnd,
        'updatedAt',
      );
    }

    const organizationObject = {};
    if (ticketsFilterObj.orgFilter) {
      organizationObject['recipient'] = {};
      organizationObject['recipient']['organization'] = {};
      organizationObject['recipient']['organization']['id'] =
        ticketsFilterObj.orgFilter;
    }

    let dueDateObject = {};
    let dueDateStartDate: any;
    let dueDateEndDate: any;
    if (ticketsFilterObj.dueDateStart) {
      [dueDateObject, dueDateStartDate, dueDateEndDate] = buildIntervalFilter(
        ticketsFilterObj.dueDateStart,
        ticketsFilterObj.dueDateEnd,
        'dueDate',
      );
    }

    let whereObject = {
      where: {
        project: { id: projectId },
        ...searchObject,
        ...openedObject,
        ...updatedObject,
        ...dueDateObject,
        ...organizationObject,
      },
    };
    whereObject = await this.userHasAccessWhere(user, projectId, whereObject);

    let extraDueDateFilterStringCondition = '';
    if (dueDateObject['dueDate']) {
      extraDueDateFilterStringCondition = ` AND "dueDate" > '${dueDateStartDate.toISOString()}' AND "dueDate" < '${dueDateEndDate.toISOString()}'`;
    }
    if (status) {
      if (
        status == TicketStatus.overdue &&
        user.organization.type == OrganizationTypes.provider
      ) {
        whereObject['where']['status'] = TicketStatus.open;
        whereObject['where']['dueDate'] = Raw(
          (dueDate) =>
            `${dueDate} < '${dayjs().toISOString()}'${extraDueDateFilterStringCondition}`,
        );
      } else if (status == TicketStatus.open) {
        if (user.organization.type == OrganizationTypes.provider) {
          whereObject['where']['status'] = TicketStatus.open;
          whereObject['where']['dueDate'] = Raw(
            (dueDate) =>
              `${dueDate} >= '${dayjs().toISOString()}'${extraDueDateFilterStringCondition}`,
          );
        } else {
          whereObject['where']['status'] = TicketStatus.open;
        }
      } else {
        whereObject['where']['status'] = status;
      }
    }

    if (orgType) {
      whereObject['where']['recipient'] = {};
      whereObject['where']['recipient']['organization'] = {};
      whereObject['where']['recipient']['organization']['type'] = orgType;
    }

    const totalCount = await this.ticketsRepository.count({
      ...whereObject,
      relations: ['recipient', 'recipient.organization'],
    });

    const ticketRecords = await this.ticketsRepository.find({
      ...whereObject,
      ...paginationObject,
      relations: ['recipient', 'recipient.organization'],
      order: { ...orderObject },
    });

    const chatIds = [];
    ticketRecords.forEach((t) => {
      chatIds.push(t.externalChatId);
      chatIds.push(t.internalChatId);
    });

    let unreadChats = [];
    if (chatIds.length > 0) {
      unreadChats = await this.connection.manager.query(
        `
            select cp."chatId", count(*) as "unreadCount"
            from chat_participant cp
                     inner join chat_messages cm on cp."chatId" = cm."chatId"
            where cp."userId" = $1
              and cp."chatId" = any ($2)
              and cm.id > cp."readMessageId"
            group by cp."chatId";
        `,
        [userId, chatIds],
      );
    }

    const updatedTicketRecords = ticketRecords.map((t) => {
      const updatedTicket = t;
      updatedTicket['unreadMessages'] = false;

      for (const chat of unreadChats) {
        if (
          (updatedTicket.externalChatId === chat.chatId ||
            updatedTicket.internalChatId === chat.chatId) &&
          chat['unreadCount'] > 0
        ) {
          updatedTicket['unreadMessages'] = true;
        }
      }
      return updatedTicket;
    });

    return {
      total: totalCount,
      data: updatedTicketRecords,
    };
  }

  async getTicketsForTechnicianByProjectId(
    page = 0,
    limit = 0,
    userId: number,
    projectId: number,
    status: TicketStatus,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const internalChats = await this.chatParticipantsRepository.find({
      where: {
        chat: { type: ChatTypes.internal },
        user: { id: userId },
      },
      relations: ['chat'],
    });

    if (!checkForRole(UserRole.technician, user.roles)) {
      throw new ForbiddenException();
    }
    const paginationObject = buildPaginationObject(page, limit);

    const whereObject = {
      where: {
        project: { id: projectId },
        internalChatId: In(
          internalChats.map((participant) => participant.chat.id),
        ),
      },
    };

    if (status) {
      if (status == TicketStatus.overdue) {
        whereObject['where']['status'] = TicketStatus.open;
        whereObject['where']['dueDate'] = LessThanOrEqual(new Date());
      } else if (status == TicketStatus.open) {
        whereObject['where']['status'] = TicketStatus.open;
        whereObject['where']['dueDate'] = MoreThanOrEqual(new Date());
      } else {
        whereObject['where']['status'] = status;
      }
    }

    const totalCount = await this.ticketsRepository.count({
      ...whereObject,
      relations: ['recipient', 'recipient.organization'],
    });
    const ticketRecords = await this.ticketsRepository.find({
      ...whereObject,
      ...paginationObject,
      relations: ['recipient', 'recipient.organization'],
    });

    const chatIds = [];
    ticketRecords.forEach((t) => {
      chatIds.push(t.externalChatId);
      chatIds.push(t.internalChatId);
    });

    let unreadChats = [];
    if (chatIds.length > 0) {
      unreadChats = await this.connection.manager.query(
        `
            select cp."chatId", count(*) as "unreadCount"
            from chat_participant cp
                     inner join chat_messages cm on cp."chatId" = cm."chatId"
            where cp."userId" = $1
              and cp."chatId" = any ($2)
              and cm.id > cp."readMessageId"
            group by cp."chatId";
        `,
        [userId, chatIds],
      );
    }

    const updatedTicketRecords = ticketRecords.map((t) => {
      const updatedTicket = t;
      updatedTicket['unreadMessages'] = false;

      for (const chat of unreadChats) {
        if (
          (updatedTicket.externalChatId === chat.chatId ||
            updatedTicket.internalChatId === chat.chatId) &&
          chat['unreadCount'] > 0
        ) {
          updatedTicket['unreadMessages'] = true;
        }
      }
      return updatedTicket;
    });

    return {
      total: totalCount,
      data: updatedTicketRecords,
    };
  }

  async findOne(ticketId: number, userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });
    if (!ticket) throw new BadRequestException(ErrorTypes.TICKET_NOT_FOUND);

    const projectId = ticket.projectId;

    let whereObject = {
      where: {
        id: ticketId,
        project: { id: projectId },
      },
    };

    whereObject = await this.userHasAccessWhere(user, projectId, whereObject);

    let internalRelations = [];
    let externalRelations = [
      'externalChat',
      'externalChat.chatParticipants',
      'externalChat.chatParticipants.user',
      'externalChat.chatParticipants.user.roles',
      'externalChat.chatParticipants.user.organization',
      'externalChat.chatParticipants.user.avatarImage',
    ];

    if (checkForRoles([...ProviderOrgRoles, UserRole.technician], user.roles)) {
      internalRelations = [
        'internalChat',
        'internalChat.chatParticipants',
        'internalChat.chatParticipants.user',
        'internalChat.chatParticipants.user.roles',
        'internalChat.chatParticipants.user.organization',
        'internalChat.chatParticipants.user.avatarImage',
      ];
    }
    if (
      checkForRoles([UserRole.procurement, UserRole.technician], user.roles)
    ) {
      externalRelations = [];
    }
    const ticketRecord = await this.ticketsRepository.findOne({
      ...whereObject,
      relations: [
        'creator',
        'recipient',
        'recipient.avatarImage',
        'recipient.roles',
        'recipient.organization',
        'project',
        'building',
        'buildingLevel',
        'buildingRooms',
        ...internalRelations,
        ...externalRelations,
      ],
    });
    if (!ticketRecord) {
      throw new BadRequestException(ErrorTypes.TICKET_NOT_FOUND);
    }

    return ticketRecord;
  }

  async update(id: number, updateTicketDto: UpdateTicketDto, userId: number) {
    const queryRunner = await this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let ticketRecord = await queryRunner.manager.findOne(Ticket, {
        where: { id },
        relations: ['externalChat', 'internalChat', 'buildingLevel'],
      });
      let statusNotification: NotificationTypes;

      if (!ticketRecord)
        throw new BadRequestException(ErrorTypes.TICKET_NOT_FOUND);

      const { chatParticipants: externalChatParticipants } =
        await queryRunner.manager.findOne(Chat, {
          where: { id: ticketRecord.externalChatId },
          relations: ['chatParticipants'],
        });

      const { chatParticipants: internalChatParticipants } =
        await queryRunner.manager.findOne(Chat, {
          where: { id: ticketRecord.internalChatId },
          relations: ['chatParticipants'],
        });

      // get user details
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);
      // get receipients from external chat
      const participantRecords = await this.chatService.getParticipantsTx(
        queryRunner,
        ticketRecord.externalChatId,
      );

      // if not a participant, add
      let participationRecord = await this.chatService.getParticipantTx(
        queryRunner,
        ticketRecord.externalChatId,
        userId,
      );

      if (!participationRecord) {
        // we have access, auto add as participant
        participationRecord = await this.chatService.addParticipantTx(
          queryRunner,
          ticketRecord.externalChatId,
          userId,
        );
      }

      if (!participationRecord.active) {
        await this.chatService.setParticipantTx(
          queryRunner,
          ticketRecord.externalChatId,
          userId,
          true,
        );
      }

      if (
        typeof updateTicketDto.priority != 'undefined' &&
        updateTicketDto.priority != ticketRecord.priority
      ) {
        const previousPriority = ticketRecord.priority;
        ticketRecord.priority = updateTicketDto.priority;
        statusNotification = NotificationTypes.ticketPriorityChanged;

        await this.chatService.addMessageTx(
          queryRunner,
          { message: '', files: [] },
          MessageTypes.priorityChanged,
          ticketRecord.externalChat.id,
          userId,
          {
            priority: updateTicketDto.priority,
          },
        );

        for (const participant of participantRecords) {
          const metadata = {
            creatorFirstName: user.firstName,
            creatorLastName: user.lastName,
            previousPriority: TicketPriority[previousPriority],
            priority: TicketPriority[ticketRecord.priority],
            projectId: ticketRecord.projectId,
            ticketId: ticketRecord.id,
            ticketSubject: ticketRecord.subject,
          };

          const createdNotification = await this.notificationsService.createTx(
            queryRunner,
            userId,
            participant.userId,
            statusNotification,
            metadata,
          );

          const notificationResponse =
            this.notificationsService.composeNotificationResponse(
              createdNotification,
            );

          await this.notificationsService.sendWebsocketNotificationByUserId(
            participant.userId,
            TICKET_NOTIFICATION,
            notificationResponse,
          );
        }
      }

      if (typeof updateTicketDto.dueDate != 'undefined') {
        ticketRecord.dueDate = updateTicketDto.dueDate;
      }

      if (typeof updateTicketDto.subject != 'undefined') {
        ticketRecord.subject = updateTicketDto.subject;
      }

      if (updateTicketDto.buildingId) {
        const building = await queryRunner.manager.findOne(
          Building,
          updateTicketDto.buildingId,
        );
        if (!building)
          throw new BadRequestException(ErrorTypes.BUILDING_NOT_FOUND);
        ticketRecord.building = building;
      }

      if (updateTicketDto.buildingLevelId) {
        const buildingLevel = await queryRunner.manager.findOne(
          BuildingLevel,
          updateTicketDto.buildingLevelId,
        );
        if (!buildingLevel)
          throw new BadRequestException(ErrorTypes.BUILDING_LEVEL_NOT_FOUND);
        ticketRecord.buildingLevel = buildingLevel;
      }

      if (updateTicketDto.buildingRoomIds) {
        const buildingRooms = await queryRunner.manager.find(BuildingRoom, {
          where: { id: In(updateTicketDto.buildingRoomIds) },
          relations: ['level'],
        });
        if (
          !buildingRooms ||
          buildingRooms.length !== updateTicketDto.buildingRoomIds.length
        )
          throw new BadRequestException(ErrorTypes.BUILDING_ROOM_NOT_FOUND);

        for (const room of buildingRooms) {
          if (room.level.id != ticketRecord.buildingLevel.id)
            throw new BadRequestException(
              ErrorTypes.BUILDING_ROOM_IS_NOT_PART_OF_BUILDING,
            );
        }
        ticketRecord.buildingRooms = buildingRooms;
      }

      if (
        typeof updateTicketDto.priority != 'undefined' &&
        typeof updateTicketDto.dueDate == 'undefined'
      ) {
        throw new BadRequestException(
          ErrorTypes.TICKET_UPDATE_NEED_TO_SPECIFY_DUE_DATE_IF_CHANGING_PRIORITY,
        );
      }

      if (
        typeof updateTicketDto.status != 'undefined' &&
        updateTicketDto.status != ticketRecord.status
      ) {
        const previousStatus = ticketRecord.status;
        ticketRecord.status = updateTicketDto.status;
        const previousStatusUpdatedAt = ticketRecord.statusUpdatedAt;
        ticketRecord.statusUpdatedAt = new Date();
        statusNotification = NotificationTypes.ticketStatusChanged;

        switch (updateTicketDto.status) {
          case TicketStatus.open:
            switch (previousStatus) {
              // NEW -> OPEN
              case TicketStatus.new:
                // ticket just opened and priority set
                ticketRecord.openedAt = new Date();

                await this.chatService.addMessage(
                  { message: '' },
                  MessageTypes.ticketOpened,
                  ticketRecord.externalChatId,
                  userId,
                  {},
                );
                break;
              // ON HOLD -> OPEN
              case TicketStatus.onHold:
                // ticket reopened from being onHold
                const now = new Date().getTime();
                const diff =
                  ticketRecord.dueDate.getTime() -
                  previousStatusUpdatedAt.getTime();
                // ticketRecord.dueDate = new Date();
                if (diff > 0) {
                  ticketRecord.dueDate = new Date(now + diff);
                }
                await this.chatService.addMessage(
                  { message: '' },
                  MessageTypes.ticketReopened,
                  ticketRecord.externalChatId,
                  userId,
                  {},
                );
                break;
              // RESOLVED -> OPEN
              case TicketStatus.resolved:
                // handled in update-resolved
                break;
            }
            break;
          case TicketStatus.onHold:
            await this.chatService.addMessage(
              { message: '' },
              MessageTypes.ticketOnHold,
              ticketRecord.externalChatId,
              userId,
              {},
            );
            break;
          case TicketStatus.resolved:
            // the ticket was resolved and set to the recipient for acceptance
            await this.chatService.addMessage(
              { message: updateTicketDto.reason },
              MessageTypes.ticketResolved,
              ticketRecord.externalChatId,
              userId,
              {},
            );
            break;
          case TicketStatus.closed:
            switch (previousStatus) {
              // RESOLVED -> CLOSED
              case TicketStatus.resolved:
                // handled in update-resolved
                break;
              // all else -> CLOSED
              default:
                await this.chatService.addMessage(
                  { message: updateTicketDto.reason },
                  MessageTypes.ticketClosed,
                  ticketRecord.externalChatId,
                  userId,
                  {},
                );
            }
            break;
          default:
            throw new BadRequestException(
              ErrorTypes.TICKET_STATUS_CHANGE_INVALID,
            );
        }

        // send ticket status notification
        // get user details
        const user = await this.usersRepository.findOne({
          where: { id: userId },
        });
        if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);
        // get receipients from external chat
        const participantRecords = await this.chatService.getParticipantsTx(
          queryRunner,
          ticketRecord.externalChatId,
        );
        for (const participant of participantRecords) {
          const metadata = {
            creatorFirstName: user.firstName,
            creatorLastName: user.lastName,
            previousStatus: previousStatus,
            status: updateTicketDto.status,
            projectId: ticketRecord.projectId,
            ticketId: ticketRecord.id,
            ticketSubject: ticketRecord.subject,
          };

          const createdNotification = await this.notificationsService.createTx(
            queryRunner,
            userId,
            participant.userId,
            statusNotification,
            metadata,
          );

          const notificationResponse =
            this.notificationsService.composeNotificationResponse(
              createdNotification,
            );

          await this.notificationsService.sendWebsocketNotificationByUserId(
            participant.userId,
            TICKET_NOTIFICATION,
            notificationResponse,
          );
        }
      }
      ticketRecord = await queryRunner.manager.save(ticketRecord);
      await queryRunner.commitTransaction();

      return ticketRecord;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new BadRequestException(err);
    } finally {
      await queryRunner.release();
    }
  }

  remove(id: number) {
    return `This action removes a #${id} ticket`;
  }

  async getAllAvailableParticipantsForTicketChat(
    id: number,
    chatType: ChatTypes,
  ) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: [
        'recipient',
        'recipient.organization',
        'recipient.organization.parentOrganization',
        'project',
        'project.users',
        'project.users.roles',
        'project.users.avatarImage',
        'project.users.organization',
      ],
    });
    if (!ticket) throw new BadRequestException(ErrorTypes.TICKET_NOT_FOUND);

    const parentOrganizationId =
      ticket.recipient.organization.parentOrganization.id;
    const parentOrganization = await this.organizationsRepository.findOne({
      where: { id: parentOrganizationId },
      relations: [
        'users',
        'users.roles',
        'users.organization',
        'users.avatarImage',
      ],
    });
    const recipientOrganizationId = ticket.recipient.organization.id;

    const availableUsers = [];
    for (const user of parentOrganization.users) {
      if (checkForRole(UserRole.admin, user.roles)) {
        availableUsers.push(user);
      }
    }

    for (const user of ticket.project.users) {
      if (
        chatType == ChatTypes.external &&
        ((user.organization.id == parentOrganizationId &&
          checkForRoles(
            [
              UserRole.coordinator,
              UserRole.projectManager,
              UserRole.assistantProjectManager,
            ],
            user.roles,
          )) ||
          user.organization.id == recipientOrganizationId)
      ) {
        availableUsers.push(user);
      }

      if (
        chatType == ChatTypes.internal &&
        user.organization.id == parentOrganizationId
      ) {
        availableUsers.push(user);
      }
    }

    return {
      total: availableUsers.length,
      data: availableUsers,
    };
  }

  async getStatistics(
    projectId: number,
    orgType: OrganizationTypes = null,
    userId: number,
    filter,
    search,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const searchObject = {};
    if (search) {
      searchObject['subject'] = ILike(`%${search}%`);
    }

    const myRegexp =
      /(organization:(?<orgFilter>.*?),)?(opened:(?<openedStart>.*?)_(?<openedEnd>.*?),)?(updated:(?<updatedStart>.*?)_(?<updatedEnd>.*?),)?/g;
    // this delimiter is needed at the end of the string
    filter += ',';
    const filterObj = myRegexp.exec(filter).groups;

    let openedObject = {};
    if (filterObj.openedStart) {
      [openedObject] = buildIntervalFilter(
        filterObj.openedStart,
        filterObj.openedEnd,
        'openedAt',
      );
    }

    let updatedObject = {};
    if (filterObj.updatedStart) {
      [updatedObject] = buildIntervalFilter(
        filterObj.updatedStart,
        filterObj.updatedEnd,
        'updatedAt',
      );
    }

    let dueDateObject = {};
    if (filterObj.dueDateStart) {
      [dueDateObject] = buildIntervalFilter(
        filterObj.dueDateStart,
        filterObj.dueDateEnd,
        'dueDate',
      );
    }

    let relations = [];

    const organizationObject = {};
    if (
      (user.organization.type === OrganizationTypes.provider ||
        user.organization.type === OrganizationTypes.beneficiary) &&
      filterObj.orgFilter
    ) {
      organizationObject['recipient'] = {};
      organizationObject['recipient']['organization'] = {};
      organizationObject['recipient']['organization']['id'] =
        filterObj.orgFilter;
      relations = ['recipient', 'recipient.organization'];
    }

    let whereObject: any = {
      where: {
        project: { id: projectId },
        ...openedObject,
        ...updatedObject,
        ...dueDateObject,
        ...organizationObject,
        ...searchObject,
      },
    };

    whereObject = await this.userHasAccessWhere(user, projectId, whereObject);

    if (
      orgType &&
      (user.organization.type == OrganizationTypes.beneficiary ||
        user.organization.type == OrganizationTypes.tenant)
    ) {
      whereObject = {
        where: {
          ...whereObject.where,
          recipient: {
            organization: {
              type: orgType ? orgType : user.organization.type,
            },
          },
        },
      };

      relations = ['recipient', 'recipient.organization'];
    }

    const statsNewCount = await this.ticketsRepository.count({
      where: {
        status: TicketStatus.new,
        ...whereObject.where,
      },
      relations: relations,
    });

    let statsOpenCount = null;
    let statsOverdueCount = null;

    if (user.organization.type == OrganizationTypes.provider) {
      statsOpenCount = await this.ticketsRepository.count({
        where: {
          status: TicketStatus.open,
          dueDate: MoreThan(new Date()),
          ...whereObject.where,
        },
        relations: relations,
      });

      statsOverdueCount = await this.ticketsRepository.count({
        where: {
          status: TicketStatus.open,
          dueDate: LessThanOrEqual(new Date()),
          ...whereObject.where,
        },
        relations: relations,
      });
    } else {
      statsOpenCount = await this.ticketsRepository.count({
        where: {
          status: TicketStatus.open,
          ...whereObject.where,
        },
        relations: relations,
      });
    }

    const statsOnHoldCount = await this.ticketsRepository.count({
      where: {
        status: TicketStatus.onHold,
        ...whereObject.where,
      },
      relations: relations,
    });

    const statsResolvedCount = await this.ticketsRepository.count({
      where: {
        status: TicketStatus.resolved,
        ...whereObject.where,
      },
      relations: relations,
    });

    const statsClosedCount = await this.ticketsRepository.count({
      where: {
        status: TicketStatus.closed,
        ...whereObject.where,
      },
      relations: relations,
    });

    const stats = [
      {
        count: statsNewCount,
        status: 'new',
      },
      {
        count: statsOpenCount,
        status: 'open',
      },
      {
        count: statsOnHoldCount,
        status: 'onHold',
      },
      {
        count: statsResolvedCount,
        status: 'resolved',
      },
      {
        count: statsClosedCount,
        status: 'closed',
      },
    ];

    if (statsOverdueCount) {
      stats.push({
        count: statsOverdueCount,
        status: 'overdue',
      });
    }

    return stats;
  }

  private async userHasAccessWhere(
    user: User,
    projectId: number,
    whereObject,
  ): Promise<any> {
    if (checkForRoles([...ProviderOrgRoles, UserRole.technician], user.roles)) {
      // provider:
      //   - is from provider org
      //   - is admin
      //   - or is in projectId of ticket
      if (checkForRole(UserRole.admin, user.roles)) {
        // no restrictions
      } else {
        if (!user.projectIds.includes(projectId)) {
          throw new BadRequestException(ErrorTypes.USER_NOT_FOUND_IN_PROJECT);
        }
      }
    } else if (checkForRoles(BeneficiaryOrgRoles, user.roles)) {
      // beneficiary:
      //   - is from beneficiary org
      //   - all tickets for project id
      if (!user.projectIds.includes(projectId)) {
        throw new BadRequestException(ErrorTypes.USER_NOT_FOUND_IN_PROJECT);
      }
    } else if (checkForRoles(TenantOrgRoles, user.roles)) {
      // tenant:
      //   - is from tenant org
      //   - tickets with tenant recipient for projectId
      //   - are from tenant org
      if (!user.projectIds.includes(projectId)) {
        throw new BadRequestException(ErrorTypes.USER_NOT_FOUND_IN_PROJECT);
      }
      const project = await this.projectsRepository.findOne({
        where: { id: projectId },
        relations: ['users', 'users.organization'],
      });

      // get all tickets created for those users
      whereObject['where']['recipient'] = {
        id: In(
          project.users
            .filter(
              (projectUser: User) =>
                projectUser.organization.id === user.organization.id,
            )
            .map((projectUser) => projectUser.id),
        ),
      };
    } else {
      throw new BadRequestException(ErrorTypes.USER_DOES_NOT_HAVE_A_VALID_ROLE);
    }
    return whereObject;
  }

  async updateResolved(
    ticketId: number,
    updateResolvedDto: UpdateResolvedDto,
    userId: number,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    // is user in tenant or beneficiary
    if (
      user.organization.type != OrganizationTypes.beneficiary &&
      user.organization.type != OrganizationTypes.tenant
    ) {
      throw new BadRequestException(
        ErrorTypes.TICKET_INVALID_ORGANIZATION_TYPE,
      );
    }

    // is user part of participants
    const ticketRecord = await this.ticketsRepository.findOne(ticketId);
    if (!ticketRecord) {
      throw new BadRequestException(ErrorTypes.TICKET_NOT_FOUND);
    }

    const participationRecord = await this.chatService.getParticipant(
      ticketRecord.externalChatId,
      userId,
    );
    if (!participationRecord || !participationRecord.active) {
      throw new BadRequestException(
        ErrorTypes.CHAT_DOES_NOT_EXIST_OR_USER_IS_NOT_A_PARTICIPANT,
      );
    }

    if (updateResolvedDto.resolved) {
      ticketRecord.status = TicketStatus.closed;
      ticketRecord.rating = updateResolvedDto.rating;

      await this.chatService.addMessage(
        { message: updateResolvedDto.reason },
        MessageTypes.ticketAccepted,
        ticketRecord.externalChatId,
        user.id,
        {
          rating: updateResolvedDto.rating,
        },
      );
    } else {
      ticketRecord.status = TicketStatus.open;

      await this.chatService.addMessage(
        { message: updateResolvedDto.reason },
        MessageTypes.ticketRejected,
        ticketRecord.externalChatId,
        user.id,
        {},
      );
    }

    return await this.ticketsRepository.save(ticketRecord);
  }

  async getChatMessages(
    ticketId: number,
    chatId: number,
    lastMessageId: number,
    userId: number,
  ) {
    const ticketRecord = await this.findOne(ticketId, userId);

    switch (chatId) {
      case ticketRecord.externalChatId:
        if (!ticketRecord.externalChat) {
          throw new BadRequestException(ErrorTypes.CHAT_NOT_FOUND);
        }
        //
        break;
      case ticketRecord.internalChatId:
        if (!ticketRecord.internalChat) {
          throw new BadRequestException(ErrorTypes.CHAT_NOT_FOUND);
        }
        // all good here
        break;
      default:
        throw new BadRequestException(ErrorTypes.CHAT_NOT_FOUND);
    }

    return this.chatService.getAllMessages(chatId, lastMessageId, userId);
  }

  async addMessage(
    addMessageDto: AddMessageDto,
    ticketId: number,
    chatId: number,
    userId: number,
  ) {
    let participationRecord = await this.chatService.getParticipant(
      chatId,
      userId,
    );

    if (!participationRecord) {
      // check access
      const ticketRecord = await this.findOne(ticketId, userId);

      switch (chatId) {
        case ticketRecord.externalChatId:
          // all good here
          break;
        case ticketRecord.internalChatId:
          if (!ticketRecord.internalChat) {
            throw new BadRequestException(
              ErrorTypes.INTERNAL_CHAT_IS_ONY_FOR_PROVIDER_USERS,
            );
          }
          // all good here
          break;
        default:
          throw new BadRequestException(ErrorTypes.CHAT_NOT_FOUND);
      }

      // we have access, auto add as participant
      participationRecord = await this.chatService.addParticipant(
        chatId,
        userId,
      );
    }

    if (!participationRecord.active) {
      await this.chatService.setParticipant(chatId, userId, true);
    }

    await this.chatService.addMessage(
      addMessageDto,
      MessageTypes.user,
      chatId,
      userId,
    );
  }

  async deleteMessage(
    ticketId: number,
    chatId: number,
    messageId: number,
    userId: number,
  ) {
    // check access
    const ticketRecord = await this.findOne(ticketId, userId);

    switch (chatId) {
      case ticketRecord.externalChatId:
        if (!ticketRecord.externalChat) {
          throw new BadRequestException(ErrorTypes.CHAT_NOT_FOUND);
        }
        // all good here
        break;
      case ticketRecord.internalChatId:
        if (!ticketRecord.internalChat) {
          throw new BadRequestException(
            ErrorTypes.INTERNAL_CHAT_IS_ONY_FOR_PROVIDER_USERS,
          );
        }
        // all good here
        break;
      default:
        throw new BadRequestException(ErrorTypes.CHAT_NOT_FOUND);
    }

    const queryRunner = await this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.chatService.deleteMessageTx(queryRunner, messageId, userId);

      await this.chatService.addMessageTx(
        queryRunner,
        { message: '' },
        MessageTypes.systemMessageDeleted,
        chatId,
        null,
        { deletedMessageId: messageId },
      );

      await queryRunner.commitTransaction();

      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new BadRequestException(err);
    } finally {
      await queryRunner.release();
    }
  }

  async addParticipantToChat(
    ticketId: number,
    chatId: number,
    userToAddId: number,
    userId: number,
  ) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: [
        'recipient',
        'recipient.organization',
        'externalChat',
        'internalChat',
      ],
    });
    if (!ticket) {
      throw new BadRequestException(ErrorTypes.TICKET_NOT_FOUND);
    }

    let chat: Chat;
    if (chatId == ticket.internalChat.id) chat = ticket.internalChat;
    if (chatId == ticket.externalChat.id) chat = ticket.externalChat;

    if (!chat) {
      throw new BadRequestException(ErrorTypes.CHAT_NOT_FOUND);
    }

    const userToAdd = await this.usersRepository.findOne({
      where: { id: userToAddId },
      relations: ['organization', 'roles'],
    });

    if (chat.type == ChatTypes.internal) {
      if (userToAdd.organization.type != OrganizationTypes.provider) {
        throw new BadRequestException(
          ErrorTypes.INTERNAL_CHAT_IS_ONY_FOR_PROVIDER_USERS,
        );
      }
    }

    if (chat.type == ChatTypes.external) {
      if (
        checkForRoles(
          [UserRole.technician, UserRole.procurement],
          userToAdd.roles,
        )
      ) {
        throw new BadRequestException(ErrorTypes.RESTRICTED_FROM_EXTERNAL_CHAT);
      }
    }

    if (
      userToAdd.projectIds.indexOf(ticket.projectId) == -1 &&
      !checkForRole(UserRole.admin, userToAdd.roles)
    ) {
      throw new BadRequestException(ErrorTypes.USER_NOT_FOUND_IN_PROJECT);
    }

    await this.chatService.addParticipantToChat(chatId, userToAddId);

    //side effects
    if (userToAdd.organization.type == OrganizationTypes.provider) {
      if (chat.type == ChatTypes.external) {
        await this.chatService.addParticipantToChat(
          ticket.internalChat.id,
          userToAddId,
        );
      }
    }
    return true;
  }

  // TODO establish who can do this
  async removeParticipantFromChat(
    ticketId: number,
    chatId: number,
    userToRemoveId: number,
    userId: number,
  ) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: [
        'recipient',
        'recipient.organization',
        'externalChat',
        'internalChat',
      ],
    });
    if (!ticket) {
      throw new BadRequestException(ErrorTypes.TICKET_NOT_FOUND);
    }

    let chat: Chat;
    if (chatId == ticket.internalChat.id) chat = ticket.internalChat;
    if (chatId == ticket.externalChat.id) chat = ticket.externalChat;

    if (!chat) {
      throw new BadRequestException(ErrorTypes.CHAT_NOT_FOUND);
    }

    const user = await this.usersRepository.findOne({
      where: { id: userToRemoveId },
      relations: ['organization'],
    });

    if (
      (user.organization.type == OrganizationTypes.beneficiary ||
        user.organization.type == OrganizationTypes.tenant) &&
      chat.type == ChatTypes.internal
    ) {
      const chatRecord = await this.chatsRepository.findOne({
        where: { id: chatId },
        relations: [
          'chatParticipants',
          'chatParticipants.user',
          'chatParticipants.user.organization',
        ],
      });
      let participantsInSameOrgCount = 0;
      for (const participant of chatRecord.chatParticipants) {
        if (participant.user.organization.id == user.organization.id) {
          participantsInSameOrgCount++;
        }
      }
      if (participantsInSameOrgCount == 1)
        throw new BadRequestException(
          ErrorTypes.YOU_NEED_TO_HAVE_AT_LEAST_ONE_USER_FROM_THE_RECIPIENT_ORG_IN_CHAT,
        );
    }

    await this.chatService.setParticipant(chatId, userToRemoveId, false);
  }

  async closeStaleTickets() {
    const daysAgo = 3;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysAgo);
    const tickets = await this.ticketsRepository.find({
      where: {
        status: TicketStatus.resolved,
        statusUpdatedAt: LessThan(cutoff),
      },
      relations: ['recipient', 'recipient.organization'],
    });

    for (const ticket of tickets) {
      await this.ticketsRepository.update(
        {
          id: ticket.id,
          status: TicketStatus.resolved,
        },
        {
          status: TicketStatus.closed,
          statusUpdatedAt: new Date(),
        },
      );

      await this.chatService.addMessage(
        { message: '' },
        MessageTypes.systemTicketClosed,
        ticket.externalChatId,
        null,
        {},
      );
    }
  }

  async search(
    namePart: string,
    projectId: number,
    userId: number,
    page = 0,
    limit = 0,
  ) {
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
      projectId,
      organizationProjects,
    );
    if (!userHasAccess) {
      throw new ForbiddenException();
    }

    const paginationObject = buildPaginationObject(page, limit);

    const count = await this.ticketsRepository.count({
      where: {
        subject: ILike(`%${namePart}%`),
        project: { id: projectId },
      },
    });

    const data = await this.ticketsRepository.find({
      where: {
        subject: ILike(`%${namePart}%`),
        project: { id: projectId },
      },
      ...paginationObject,
    });
    return {
      total: count,
      data,
    };
  }
}
