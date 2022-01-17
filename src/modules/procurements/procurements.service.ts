import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  Connection,
  DeepPartial,
  ILike,
  In,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  Not,
  Repository,
} from 'typeorm';
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
import { CreateProcurementDto } from './dto/create-procurement.dto';
import { UpdateProcurementDto } from './dto/update-procurement.dto';
import { Procurement } from './entities/procurement.entity';
import { checkForRole, checkForRoles } from '../../util/roles';
import {
  BeneficiaryOrgRoles,
  ProviderOrgRoles,
  TenantOrgRoles,
  UserRole,
} from '../authentication/enums/user-roles.enum';
import { MessageTypes } from '../chat/enums/message-types.enum';
import { ProcurementStatus } from './enum/procurement-status.enum';
import { buildPaginationObject } from '../../util/pagination';
import { ChatTypes } from '../chat/enums/chat-types.enum';
import { Equipment } from '../equipments/entities/equipment.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

import { SubmitProcurementProposalDto } from './dto/submit-procurement-proposal.dto';
import { Chat } from '../chat/entities/chat.entity';
import { OrganizationTypes } from '../organizations/enums/organization-types.enum';
import { AddMessageDto } from '../chat/dto/add-message.dto';
import { buildOrderObject } from '../../util/order';
import * as dayjs from 'dayjs';
import { buildIntervalFilter } from '../../util/filter';
import { Currency } from './enum/currency.enum';
import { UpdateWorkFinishedDto } from './dto/update-work-finished.dto';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class ProcurementsService {
  constructor(
    private connection: Connection,
    @InjectRepository(Procurement)
    private procurementsRepository: Repository<Procurement>,
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
    @InjectRepository(Chat)
    private chatsRepository: Repository<Chat>,
    private readonly chatService: ChatService,
    private readonly emailsService: EmailsService,
    private config: AppConfig,
  ) {}

  async create(createProcurementDto: CreateProcurementDto, userId: number) {
    const queryRunner = this.connection.createQueryRunner();

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
        if (typeof createProcurementDto.recipientId == 'undefined')
          throw new BadRequestException(
            ErrorTypes.TICKET_RECIPIENT_MUST_BE_SET,
          );
        recipientUser = await queryRunner.manager.findOne(User, {
          where: { id: createProcurementDto.recipientId },
          relations: ['organization', 'roles'],
        });
        if (!recipientUser)
          throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);
      }

      const procurementData: DeepPartial<Procurement> = {
        ...createProcurementDto,
        creator: creatingUser,
        recipient: recipientUser,
      };
      const procurement: Procurement =
        this.procurementsRepository.create(procurementData);

      const project = await queryRunner.manager.findOne(Project, {
        where: { id: createProcurementDto.projectId },
        relations: ['users', 'users.roles'],
      });
      if (!project) throw new BadRequestException(ErrorTypes.PROJECT_NOT_FOUND);
      procurement.project = project;

      // NOTES
      // beneficiary or tenant
      // add opening user + project manager
      // for organization only project manager
      // add project manager + who the procurement is for ?
      const externalParticipantIds: number[] = [];
      const internalParticipantIds: number[] = [];

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

        if (checkForRole(UserRole.procurement, projectUser.roles)) {
          internalParticipantIds.push(projectUser.id);
        }
      }

      // if procurement is created by a beneficiary or tenant user add the creator to external chat
      if (
        checkForRoles(
          [...BeneficiaryOrgRoles, ...TenantOrgRoles],
          creatingUser.roles,
        )
      ) {
        externalParticipantIds.push(creatingUser.id);
      }

      // if procurement is created by a coord, pm or apm the recipient user is added to external chat
      if (checkForRoles([...ProviderOrgRoles], creatingUser.roles)) {
        externalParticipantIds.push(recipientUser.id);
      }

      // if procurement is created by an admin add the admin to both internal and external chat
      if (checkForRole(UserRole.admin, creatingUser.roles)) {
        externalParticipantIds.push(creatingUser.id);
        internalParticipantIds.push(creatingUser.id);
      }

      procurement.externalChat = await this.chatService.create(
        queryRunner,
        externalParticipantIds,
        ChatTypes.external,
      );
      procurement.internalChat = await this.chatService.create(
        queryRunner,
        internalParticipantIds,
        ChatTypes.internal,
      );

      const files = [];
      if (createProcurementDto.fileIds) {
        for (const fileUuid of createProcurementDto.fileIds) {
          files.push({ uuid: fileUuid });
        }
      }
      await this.chatService.addMessageTx(
        queryRunner,
        { message: createProcurementDto.description, files },
        MessageTypes.userNewProcurement,
        procurement.externalChat.id,
        creatingUser.id,
        {
          subject: createProcurementDto.subject,
        },
      );

      if (createProcurementDto.equipmentIds) {
        const equipments = await queryRunner.manager.find(Equipment, {
          where: { id: In(createProcurementDto.equipmentIds) },
        });
        procurement.equipments = equipments;
      }

      if (createProcurementDto.ticketIds) {
        const tickets = await queryRunner.manager.find(Ticket, {
          where: { id: In(createProcurementDto.ticketIds) },
        });
        procurement.tickets = tickets;
      }

      const procurementRecord = await queryRunner.manager.save(procurement);

      await queryRunner.commitTransaction();

      return procurementRecord;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new BadRequestException(err);
    } finally {
      await queryRunner.release();
    }
  }

  async getProcurementsForUserByProjectId(
    page = 0,
    limit = 0,
    userId: number,
    projectId: number,
    status: ProcurementStatus,
    order: string,
    filter: string,
    search: string,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    if (
      checkForRole(UserRole.procurement, user.roles) &&
      status == ProcurementStatus.new
    ) {
      throw new ForbiddenException();
    }

    const paginationObject = buildPaginationObject(page, limit);
    const orderObject = buildOrderObject(order, ['subject', 'updatedAt'], {
      id: 'DESC',
    });

    const searchObject = {};
    if (search) {
      searchObject['subject'] = ILike(`%${search}%`);
    }

    const myRegexp =
      /(organization:(?<orgFilter>.*?),)?(opened:(?<openedStart>.*?)_(?<openedEnd>.*?),)?(updated:(?<updatedStart>.*?)_(?<updatedEnd>.*?),)?/g;
    // this delimiter is needed at the end of the string
    filter += ',';
    const procurementsFilterObj = myRegexp.exec(filter).groups;

    let openedObject = {};
    if (procurementsFilterObj.openedStart) {
      [openedObject] = buildIntervalFilter(
        procurementsFilterObj.openedStart,
        procurementsFilterObj.openedEnd,
        'openedAt',
      );
    }

    let updatedObject = {};
    if (procurementsFilterObj.updatedStart) {
      [updatedObject] = buildIntervalFilter(
        procurementsFilterObj.updatedStart,
        procurementsFilterObj.updatedEnd,
        'updatedAt',
      );
    }

    const organizationObject = {};
    if (procurementsFilterObj.orgFilter) {
      organizationObject['recipient'] = {};
      organizationObject['recipient']['organization'] = {};
      organizationObject['recipient']['organization']['id'] =
        procurementsFilterObj.orgFilter;
    }

    let whereObject = {
      where: {
        project: { id: projectId },
        ...openedObject,
        ...updatedObject,
        ...searchObject,
        ...organizationObject,
      },
    };

    whereObject = await this.userHasAccessWhere(user, projectId, whereObject);

    if (status) {
      whereObject['where']['status'] = status;
    }

    if (checkForRole(UserRole.procurement, user.roles) && !status) {
      whereObject['where']['status'] = Not(ProcurementStatus.new);
    }

    const totalCount = await this.procurementsRepository.count({
      ...whereObject,
      relations: ['recipient', 'recipient.organization'],
    });

    const procurementRecords = await this.procurementsRepository.find({
      ...whereObject,
      ...paginationObject,
      relations: ['recipient', 'recipient.organization'],
      order: { ...orderObject },
    });

    const chatIds = [];
    procurementRecords.every((pr) => {
      chatIds.push(pr.externalChatId);
      chatIds.push(pr.internalChatId);
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

    const updatedProcurementRecords = procurementRecords.map((pr) => {
      const updatedProcurementRecord = pr;
      updatedProcurementRecord['unreadMessages'] = false;

      for (const chat of unreadChats) {
        if (
          (updatedProcurementRecord.externalChatId === chat.chatId ||
            updatedProcurementRecord.internalChatId === chat.chatId) &&
          chat['unreadCount'] > 0
        ) {
          updatedProcurementRecord['unreadMessages'] = true;
        }
      }
      return updatedProcurementRecord;
    });

    return {
      total: totalCount,
      data: updatedProcurementRecords,
    };
  }

  async getStatistics(
    projectId: number,
    userId: number,
    filter: string,
    search: string,
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

    let relations = [];
    const organizationObject = {};
    if (
      user.organization.type === OrganizationTypes.provider &&
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
        ...searchObject,
        ...organizationObject,
      },
    };

    whereObject = await this.userHasAccessWhere(user, projectId, whereObject);

    let statsNewCount = 0;
    if (!checkForRole(UserRole.procurement, user.roles)) {
      statsNewCount = await this.procurementsRepository.count({
        where: {
          status: ProcurementStatus.new,
          ...whereObject.where,
        },
        relations: relations,
      });
    }

    const statsOpenCount = await this.procurementsRepository.count({
      where: {
        status: ProcurementStatus.open,
        ...whereObject.where,
      },
      relations: relations,
    });

    const statsProposalSubmittedCount = await this.procurementsRepository.count(
      {
        where: {
          status: ProcurementStatus.proposalSubmitted,
          ...whereObject.where,
        },
        relations: relations,
      },
    );

    const statsAcceptedCount = await this.procurementsRepository.count({
      where: {
        status: ProcurementStatus.accepted,
        ...whereObject.where,
      },
      relations: relations,
    });

    const statsRejectedCount = await this.procurementsRepository.count({
      where: {
        status: ProcurementStatus.rejected,
        ...whereObject.where,
      },
      relations: relations,
    });

    const statsWorkInProgressCount = await this.procurementsRepository.count({
      where: {
        status: ProcurementStatus.workInProgress,
        ...whereObject.where,
      },
      relations: relations,
    });

    const statsWorkFinishedCount = await this.procurementsRepository.count({
      where: {
        status: ProcurementStatus.workFinished,
        ...whereObject.where,
      },
      relations: relations,
    });

    const statsClosedCount = await this.procurementsRepository.count({
      where: {
        status: ProcurementStatus.closed,
        ...whereObject.where,
      },
      relations: relations,
    });

    const stats = [
      {
        count: statsNewCount,
        status: ProcurementStatus.new,
      },
      {
        count: statsOpenCount,
        status: ProcurementStatus.open,
      },
      {
        count: statsProposalSubmittedCount,
        status: ProcurementStatus.proposalSubmitted,
      },
      {
        count: statsAcceptedCount,
        status: ProcurementStatus.accepted,
      },
      {
        count: statsRejectedCount,
        status: ProcurementStatus.rejected,
      },
      {
        count: statsWorkInProgressCount,
        status: ProcurementStatus.workInProgress,
      },
      {
        count: statsWorkFinishedCount,
        status: ProcurementStatus.workFinished,
      },
      {
        count: statsClosedCount,
        status: ProcurementStatus.closed,
      },
    ];

    return stats;
  }

  async findOne(id: number, userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'organization'],
    });
    if (!user) throw new BadRequestException(ErrorTypes.USER_NOT_FOUND);

    const procurement = await this.procurementsRepository.findOne({
      where: { id: id },
    });
    if (!procurement)
      throw new BadRequestException(ErrorTypes.PROCUREMENT_NOT_FOUND);

    const projectId = procurement.projectId;

    let whereObject = {
      where: {
        id: id,
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

    if (
      checkForRoles([...ProviderOrgRoles, UserRole.procurement], user.roles)
    ) {
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

    const procurementRecord = await this.procurementsRepository.findOne(id, {
      ...whereObject,
      relations: [
        'creator',
        'recipient',
        'project',
        'equipments',
        'tickets',
        'proposalFile',
        ...internalRelations,
        ...externalRelations,
      ],
    });

    if (!procurementRecord) {
      throw new BadRequestException(ErrorTypes.PROCUREMENT_NOT_FOUND);
    }

    return procurementRecord;
  }

  async update(
    id: number,
    updateProcurementDto: UpdateProcurementDto,
    userId: number,
  ) {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const procurementRecord: Procurement = await queryRunner.manager.findOne(
        Procurement,
        {
          where: { id },
          relations: ['externalChat'],
        },
      );

      if (!procurementRecord)
        throw new BadRequestException(ErrorTypes.PROCUREMENT_NOT_FOUND);

      // if not a participant, add
      let participationRecord = await this.chatService.getParticipantTx(
        queryRunner,
        procurementRecord.externalChatId,
        userId,
      );

      if (!participationRecord) {
        // we have access, auto add as participant
        participationRecord = await this.chatService.addParticipantTx(
          queryRunner,
          procurementRecord.externalChatId,
          userId,
        );
      }

      if (!participationRecord.active) {
        await this.chatService.setParticipantTx(
          queryRunner,
          procurementRecord.externalChatId,
          userId,
          true,
        );
      }

      if (typeof updateProcurementDto.subject != 'undefined') {
        procurementRecord.subject = updateProcurementDto.subject;
      }

      if (typeof updateProcurementDto.equipmentIds != 'undefined') {
        const equipments = await queryRunner.manager.find(Equipment, {
          where: { id: In(updateProcurementDto.equipmentIds) },
        });
        procurementRecord.equipments = equipments;
      }

      if (typeof updateProcurementDto.ticketIds != 'undefined') {
        const tickets = await queryRunner.manager.find(Ticket, {
          where: { id: In(updateProcurementDto.ticketIds) },
        });
        procurementRecord.tickets = tickets;
      }

      if (
        typeof updateProcurementDto.status != 'undefined' &&
        updateProcurementDto.status != procurementRecord.status
      ) {
        const previousStatus = procurementRecord.status;
        procurementRecord.status = updateProcurementDto.status;
        procurementRecord.statusUpdatedAt = new Date();

        switch (updateProcurementDto.status) {
          case ProcurementStatus.open:
            switch (previousStatus) {
              case ProcurementStatus.new:
                procurementRecord.openedAt = new Date();

                await this.chatService.addMessageTx(
                  queryRunner,
                  {
                    message: updateProcurementDto.reason
                      ? updateProcurementDto.reason
                      : '',
                    files: [],
                  },
                  MessageTypes.procurementOpened,
                  procurementRecord.externalChat.id,
                  userId,
                  {},
                );
                break;
              case ProcurementStatus.proposalSubmitted:
                procurementRecord.proposalAmount = 0;
                procurementRecord.proposalCurrency = Currency.RON;
                procurementRecord.proposalFile = null;

                await this.chatService.addMessageTx(
                  queryRunner,
                  {
                    message: updateProcurementDto.reason
                      ? updateProcurementDto.reason
                      : '',
                    files: [],
                  },
                  MessageTypes.procurementProposalCanceled,
                  procurementRecord.externalChat.id,
                  userId,
                  {},
                );
                break;
            }
            break;
          case ProcurementStatus.accepted:
            procurementRecord.rating = updateProcurementDto.rating;

            await this.chatService.addMessageTx(
              queryRunner,
              {
                message: updateProcurementDto.reason
                  ? updateProcurementDto.reason
                  : '',
                files: [],
              },
              MessageTypes.procurementProposalAccepted,
              procurementRecord.externalChat.id,
              userId,
              {},
            );
            break;

          case ProcurementStatus.rejected:
            procurementRecord.proposalAmount = 0;
            procurementRecord.proposalCurrency = Currency.RON;
            procurementRecord.proposalFile = null;

            await this.chatService.addMessageTx(
              queryRunner,
              {
                message: updateProcurementDto.reason
                  ? updateProcurementDto.reason
                  : '',
                files: [],
              },
              MessageTypes.procurementProposalRejected,
              procurementRecord.externalChat.id,
              userId,
              {},
            );
            break;

          case ProcurementStatus.workInProgress:
            await this.chatService.addMessageTx(
              queryRunner,
              {
                message: updateProcurementDto.reason
                  ? updateProcurementDto.reason
                  : '',
                files: [],
              },
              MessageTypes.procurementWorkStarted,
              procurementRecord.externalChat.id,
              userId,
              {},
            );
            break;

          case ProcurementStatus.workFinished:
            await this.chatService.addMessageTx(
              queryRunner,
              {
                message: updateProcurementDto.reason
                  ? updateProcurementDto.reason
                  : '',
                files: [],
              },
              MessageTypes.procurementWorkFinished,
              procurementRecord.externalChat.id,
              userId,
              {},
            );
            break;

          case ProcurementStatus.closed:
            await this.chatService.addMessageTx(
              queryRunner,
              {
                message: updateProcurementDto.reason
                  ? updateProcurementDto.reason
                  : '',
                files: [],
              },
              MessageTypes.procurementClosed,
              procurementRecord.externalChat.id,
              userId,
              {},
            );
            break;
        }
      }

      await queryRunner.manager.save(procurementRecord);

      await queryRunner.commitTransaction();

      return procurementRecord;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new BadRequestException(err);
    } finally {
      await queryRunner.release();
    }
  }

  async updateWorkFinished(
    procurementId: number,
    updateWorkFinishedDto: UpdateWorkFinishedDto,
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
        ErrorTypes.PROCUREMENT_INVALID_ORGANIZATION_TYPE,
      );
    }

    // is user part of participants
    const procurementRecord = await this.procurementsRepository.findOne(
      procurementId,
    );
    if (!procurementRecord) {
      throw new BadRequestException(ErrorTypes.TICKET_NOT_FOUND);
    }

    const participationRecord = await this.chatService.getParticipant(
      procurementRecord.externalChatId,
      userId,
    );
    if (!participationRecord || !participationRecord.active) {
      throw new BadRequestException(
        ErrorTypes.CHAT_DOES_NOT_EXIST_OR_USER_IS_NOT_A_PARTICIPANT,
      );
    }

    if (updateWorkFinishedDto.resolved) {
      procurementRecord.status = ProcurementStatus.closed;
      procurementRecord.rating = updateWorkFinishedDto.rating;

      await this.chatService.addMessage(
        { message: updateWorkFinishedDto.reason },
        MessageTypes.procurementWorkAccepted,
        procurementRecord.externalChatId,
        user.id,
        {
          rating: updateWorkFinishedDto.rating,
        },
      );
    } else {
      procurementRecord.status = ProcurementStatus.workInProgress;

      await this.chatService.addMessage(
        { message: updateWorkFinishedDto.reason },
        MessageTypes.procurementWorkRejected,
        procurementRecord.externalChatId,
        user.id,
        {},
      );
    }

    return await this.procurementsRepository.save(procurementRecord);
  }

  async submitProposal(
    id: number,
    submitProcurementProposalDto: SubmitProcurementProposalDto,
    userId: number,
  ) {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const procurement: Procurement = await queryRunner.manager.findOne(
        Procurement,
        {
          where: { id },
          relations: [
            'externalChat',
            'externalChat.chatParticipants',
            'externalChat.chatParticipants.user',
          ],
        },
      );
      if (!procurement)
        throw new BadRequestException(ErrorTypes.PROCUREMENT_NOT_FOUND);

      const proposalFile: File = await queryRunner.manager.findOne(File, {
        where: { uuid: submitProcurementProposalDto.proposalFileUuid },
      });
      if (!proposalFile)
        throw new BadRequestException(ErrorTypes.FILE_NOT_FOUND);

      procurement.status = ProcurementStatus.proposalSubmitted;
      procurement.proposalCurrency = submitProcurementProposalDto.currency;
      procurement.proposalAmount = submitProcurementProposalDto.amount;
      procurement.proposalFile = proposalFile;

      await this.chatService.addMessageTx(
        queryRunner,
        { message: '', files: [proposalFile.uuid] },
        MessageTypes.procurementProposalSubmitted,
        procurement.externalChat.id,
        userId,
        {
          status: MessageTypes.procurementProposalSubmitted,
          currency: submitProcurementProposalDto.currency,
          amount: submitProcurementProposalDto.amount,
        },
      );

      const procurementRecord = await queryRunner.manager.save(procurement);
      this.emailsService.sendEmailForProcurementProposal(
        procurement,
        submitProcurementProposalDto.ccEmails,
      );
      await queryRunner.commitTransaction();

      return procurementRecord;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new BadRequestException(err);
    } finally {
      await queryRunner.release();
    }
  }

  remove(id: number) {
    return `This action removes a #${id} procurement`;
  }

  async closeStaleProposals() {
    const daysAgo = 3;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysAgo);
    const tickets = await this.procurementsRepository.find({
      where: {
        status: ProcurementStatus.workFinished,
        statusUpdatedAt: LessThan(cutoff),
      },
      relations: ['recipient', 'recipient.organization'],
    });

    for (const ticket of tickets) {
      await this.procurementsRepository.update(
        {
          id: ticket.id,
          status: ProcurementStatus.workFinished,
        },
        {
          status: ProcurementStatus.closed,
          statusUpdatedAt: new Date(),
        },
      );

      await this.chatService.addMessage(
        { message: '' },
        MessageTypes.systemProcurementClosed,
        ticket.externalChatId,
        null,
        {},
      );
    }
  }

  //chat related functions
  async getChatMessages(
    procurementId: number,
    chatId: number,
    lastMessageId: number,
    userId: number,
  ) {
    const procurementRecord = await this.findOne(procurementId, userId);

    switch (chatId) {
      case procurementRecord.externalChatId:
        // all good here
        break;
      case procurementRecord.internalChatId:
        if (!procurementRecord.internalChat) {
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
    procurementId: number,
    chatId: number,
    userId: number,
  ) {
    let participationRecord = await this.chatService.getParticipant(
      chatId,
      userId,
    );

    if (!participationRecord) {
      // check access
      const procurementRecord = await this.findOne(procurementId, userId);

      switch (chatId) {
        case procurementRecord.externalChatId:
          // all good here
          break;
        case procurementRecord.internalChatId:
          if (!procurementRecord.internalChat) {
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
    procurementId: number,
    chatId: number,
    messageId: number,
    userId: number,
  ) {
    // check access
    const procurementRecord = await this.findOne(procurementId, userId);

    switch (chatId) {
      case procurementRecord.externalChatId:
        if (!procurementRecord.externalChat) {
          throw new BadRequestException(ErrorTypes.CHAT_NOT_FOUND);
        }
        // all good here
        break;
      case procurementRecord.internalChatId:
        if (!procurementRecord.internalChat) {
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
    procurementId: number,
    chatId: number,
    userToAddId: number,
    userId: number,
  ) {
    const procurement = await this.procurementsRepository.findOne({
      where: { id: procurementId },
      relations: [
        'recipient',
        'recipient.organization',
        'externalChat',
        'internalChat',
      ],
    });
    if (!procurement) {
      throw new BadRequestException(ErrorTypes.TICKET_NOT_FOUND);
    }

    let chat: Chat;
    if (chatId == procurement.internalChat.id) chat = procurement.internalChat;
    if (chatId == procurement.externalChat.id) chat = procurement.externalChat;

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
      userToAdd.projectIds.indexOf(procurement.projectId) == -1 &&
      !checkForRole(UserRole.admin, userToAdd.roles)
    ) {
      throw new BadRequestException(ErrorTypes.USER_NOT_FOUND_IN_PROJECT);
    }

    await this.chatService.addParticipantToChat(chatId, userToAddId);

    //side effects
    if (userToAdd.organization.type == OrganizationTypes.provider) {
      if (chat.type == ChatTypes.external) {
        await this.chatService.addParticipantToChat(
          procurement.internalChat.id,
          userToAddId,
        );
      }
    }
    return true;
  }

  async removeParticipantFromChat(
    procurementId: number,
    chatId: number,
    userToRemoveId: number,
    userId: number,
  ) {
    const procurement = await this.procurementsRepository.findOne({
      where: { id: procurementId },
      relations: [
        'recipient',
        'recipient.organization',
        'externalChat',
        'internalChat',
      ],
    });
    if (!procurement) {
      throw new BadRequestException(ErrorTypes.TICKET_NOT_FOUND);
    }

    let chat: Chat;
    if (chatId == procurement.internalChat.id) chat = procurement.internalChat;
    if (chatId == procurement.externalChat.id) chat = procurement.externalChat;

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

  private async userHasAccessWhere(
    user: User,
    projectId: number,
    whereObject,
  ): Promise<any> {
    if (
      checkForRoles([...ProviderOrgRoles, UserRole.procurement], user.roles)
    ) {
      // provider:
      //   - is from provider org
      //   - is admin
      //   - or is in projectId of procurement
      if (checkForRoles([UserRole.admin, UserRole.procurement], user.roles)) {
        // no restrictions
      } else {
        if (!user.projectIds.includes(projectId)) {
          throw new BadRequestException(ErrorTypes.USER_NOT_FOUND_IN_PROJECT);
        }
      }
    } else if (
      checkForRoles([...TenantOrgRoles, ...BeneficiaryOrgRoles], user.roles)
    ) {
      // tenant:
      //   - is from tenant org
      //   - procurements with tenant recipient for projectId
      //   - are from tenant org
      if (!user.projectIds.includes(projectId)) {
        throw new BadRequestException(ErrorTypes.USER_NOT_FOUND_IN_PROJECT);
      }
      const project = await this.projectsRepository.findOne({
        where: { id: projectId },
        relations: ['users', 'users.organization'],
      });

      //get all procurements created for those users
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

  async getAllAvailableParticipantsForProcurementChat(
    id: number,
    chatType: ChatTypes,
  ) {
    const procurement = await this.procurementsRepository.findOne({
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
    if (!procurement)
      throw new BadRequestException(ErrorTypes.PROCUREMENT_NOT_FOUND);

    const parentOrganizationId =
      procurement.recipient.organization.parentOrganization.id;
    const parentOrganization = await this.organizationsRepository.findOne({
      where: { id: parentOrganizationId },
      relations: [
        'users',
        'users.roles',
        'users.organization',
        'users.avatarImage',
      ],
    });
    const recipientOrganizationId = procurement.recipient.organization.id;

    const availableUsers = [];
    for (const user of parentOrganization.users) {
      if (checkForRole(UserRole.admin, user.roles)) {
        availableUsers.push(user);
      }
    }

    for (const user of procurement.project.users) {
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
}
