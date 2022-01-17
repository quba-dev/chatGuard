import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Connection,
  DeepPartial,
  In,
  MoreThan,
  QueryRunner,
  Repository,
} from 'typeorm';
import * as uniq from 'lodash/uniq';
import * as uniqBy from 'lodash/uniqBy';

import { Chat } from './entities/chat.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { AddMessageDto } from './dto/add-message.dto';
import { ChatMessages } from './entities/chat-message.entity';
import { File } from '../files/entities/file.entity';
import { MessageTypes } from './enums/message-types.enum';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { ChatTypes } from './enums/chat-types.enum';
import { User } from '../users/entities/user.entity';
import { OrganizationTypes } from '../organizations/enums/organization-types.enum';
import { getChatListDto } from 'src/websocket/dto/get-chat-list.dto';
import { UserRole } from '../authentication/enums/user-roles.enum';
import { UserChatParticipantDto } from './dto/user-chat-participant.dto';
import { UserMessageDto } from './dto/user-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { GetChatsResponseDto } from './dto/get-chats-response.dto';

@Injectable()
export class ChatService {
  constructor(
    private connection: Connection,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(ChatParticipant)
    private chatParticipantRepository: Repository<ChatParticipant>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ChatMessages)
    private chatMessageRepository: Repository<ChatMessages>,
  ) {}

  async getChatByIdTx(
    chatId: number,
    clientId: number,
    limit: number,
    offset: number,
  ) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const chat = await queryRunner.manager.findOne(Chat, {
        where: { id: chatId },
        relations: ['chatParticipants'],
      });

      if (!chat) {
        return new Error(`Chat not found with chatId: ${chatId}`);
      }

      const chatParticipants = await this.getChatUserParticipants(
        queryRunner,
        chatId,
      );
      const chatResponse: ChatResponseDto = {
        ...chat.toJSON(),
        chatParticipants,
      };

      const currentUser = chatParticipants.find(
        (participant) => participant.userId === clientId,
      );

      if (!currentUser) {
        return new Error(`you're not participate of the chat`);
      }

      const { total, messages } = await this.getMessagesByChatId(
        queryRunner,
        chatId,
        limit,
        offset,
      );

      const lastMessage = messages[messages.length - 1];
      const existNewMessage = currentUser.readMessageId === lastMessage?.id;
      if (existNewMessage) {
        await queryRunner.manager.update(
          ChatParticipant,
          { userId: clientId },
          { readMessageId: lastMessage.id },
        );
      }
      await queryRunner.commitTransaction();

      return {
        chat: chatResponse,
        messages: {
          messages,
          total,
        },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new BadRequestException(err);
    } finally {
      await queryRunner.release();
    }
  }

  async getChatList(clientId: number, dto: getChatListDto) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const acceptableTypes: ChatTypes[] = [
        ChatTypes.privateChat,
        ChatTypes.groupChat,
      ];

      const currentChatParticipant = await queryRunner.manager.find(
        ChatParticipant,
        {
          where: { userId: clientId, active: true },
        },
      );

      if (!currentChatParticipant.length) {
        return {
          ...dto,
          total: 0,
          chats: [],
        };
      }

      const chatIds: number[] = uniq(
        currentChatParticipant.map((chat) => chat.chatId),
      );
      const chatsAndCount = await queryRunner.manager.findAndCount(Chat, {
        where: {
          id: In(chatIds),
          type: In(acceptableTypes),
        },
        skip: dto.offset,
        take: dto.limit,
      });
      const chats: GetChatsResponseDto[] = JSON.parse(
        JSON.stringify(chatsAndCount[0]),
      );
      const total = chatsAndCount[1];

      for (const chat of chats) {
        chat.chatParticipants = await this.getChatUserParticipants(
          queryRunner,
          chat.id,
        );
        const limit = 1;
        const offset = 0;

        const { messages } = await this.getMessagesByChatId(
          queryRunner,
          chat.id,
          limit,
          offset,
        );
        chat.lastMessage = messages[0];
      }

      return {
        ...dto,
        total,
        chats,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new BadRequestException(err);
    } finally {
      await queryRunner.release();
    }
  }

  async getChatById(chatId: number) {
    return await this.chatRepository.findOne(chatId);
  }

  // async isPrivateChatExist(ids: number[]) {
  //   const chatIds = await this.chatParticipantRepository
  //     .createQueryBuilder('chat_participant')
  //     .select('chat_participant.chatId AS "chatId"')
  //     .innerJoin('chat', 'chat', 'chat.id = chat_participant.chatId')
  //     .where('chat_participant.userId IN (:...ids)', { ids })
  //     .andWhere('chat.type = :type', { type: ChatTypes.privateChat })
  //     .groupBy('"chatId"')
  //     .having('count(*) = 2')
  //     .getRawMany();
  //
  //   return chatIds.length > 0;
  // }

  async getUserChatParticipant(
    queryRunner: QueryRunner,
    chatId: number,
    clientId: number,
  ): Promise<UserChatParticipantDto> {
    return await queryRunner.manager
      .createQueryBuilder()
      .select([
        'chat_participant.id AS id',
        'chat_participant.active AS active',
        'chat_participant.chatId AS "chatId"',
        'chat_participant.readMessageId AS "readMessageId"',
        'chat_participant.userId AS "userId"',
        'chat_participant.role AS role',
        'user.firstName AS "firstName"',
        'user.lastName AS "lastName"',
        'user.avatarImageUuid AS "avatarImageUuid"',
      ])
      .from(ChatParticipant, 'chat_participant')
      .where(
        'chat_participant.chatId = :chatId AND chat_participant.userId = :clientId',
        { chatId, clientId },
      )
      .leftJoin('user', 'user', 'user.id = chat_participant.userId')
      .getRawOne();
  }

  async getChatUserParticipants(
    queryRunner: QueryRunner,
    chatId: number,
    limit = 25,
    offset = 0,
  ): Promise<UserChatParticipantDto[]> {
    return await queryRunner.manager
      .createQueryBuilder()
      .select([
        'chat_participant.id AS id',
        'chat_participant.active AS active',
        'chat_participant.chatId AS "chatId"',
        'chat_participant.readMessageId AS "readMessageId"',
        'chat_participant.userId AS "userId"',
        'chat_participant.role AS role',
        'user.firstName AS "firstName"',
        'user.lastName AS "lastName"',
        'user.avatarImageUuid AS "avatarImageUuid"',
      ])
      .from(ChatParticipant, 'chat_participant')
      .where('chat_participant.chatId = :chatId', { chatId })
      .leftJoin('user', 'user', 'user.id = chat_participant.userId')
      .limit(limit)
      .skip(offset)
      .getRawMany();
  }

  async getMessagesById(chaId: number) {
    return await this.chatRepository.find({
      where: { id: chaId },
      relations: ['chatParticipants', 'messages'],
    });
  }

  async getMessageByChatId(chatId: number, messageId: number) {
    return await this.chatMessageRepository.findOne({
      where: {
        chat: chatId,
        id: messageId,
      },
    });
  }

  async create(
    queryRunner: QueryRunner,
    participantIds: number[],
    type: ChatTypes,
    title?: string,
    ownerChatId?: number,
  ) {
    const newChat = queryRunner.manager.create(Chat, { type });

    newChat.chatTitle = title;

    await queryRunner.manager.save(newChat);

    if (participantIds) {
      for (const participantId of participantIds) {
        let newParticipant: ChatParticipant;

        if (participantId === ownerChatId) {
          newParticipant = queryRunner.manager.create(ChatParticipant, {
            role: UserRole.chatOwner,
          });
        } else {
          newParticipant = queryRunner.manager.create(ChatParticipant);
        }
        newParticipant.chat = { id: newChat.id };
        newParticipant.userId = participantId;
        await queryRunner.manager.save(newParticipant);
      }
    }

    return newChat;
  }

  async addParticipantToChat(chatId: number, userId: number) {
    const chat = await this.chatRepository.findOne(chatId);
    if (!chat) {
      throw new BadRequestException(ErrorTypes.CHAT_NOT_FOUND);
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (
      chat.type == ChatTypes.internal ||
      chat.type == ChatTypes.staffChannel ||
      chat.type == ChatTypes.managementChannel
    ) {
      if (user.organization.type != OrganizationTypes.provider) {
        throw new BadRequestException(
          ErrorTypes.INTERNAL_CHAT_IS_ONY_FOR_PROVIDER_USERS,
        );
      }
    }
    //check that the user is assigned to project ?
    const participationRecord = await this.getParticipant(chatId, userId);

    if (participationRecord) {
      if (!participationRecord.active) {
        await this.setParticipant(chatId, userId, true);
      }

      return true;
    }

    await this.addParticipant(chatId, userId);
    return true;
  }

  async addMessage(
    addMessageDto: AddMessageDto,
    messageType: MessageTypes,
    chatId: number,
    userId: number,
    metadata = undefined,
  ) {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const msg = await this.addMessageTx(
        queryRunner,
        addMessageDto,
        messageType,
        chatId,
        userId,
        metadata,
      );
      await queryRunner.commitTransaction();

      return msg;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err);
    } finally {
      await queryRunner.release();
    }
  }

  async addMessageTx(
    queryRunner: QueryRunner,
    addMessageDto: AddMessageDto,
    messageType: MessageTypes,
    chatId: number,
    userId: number,
    metadata = undefined,
  ) {
    const files: DeepPartial<File>[] = [];
    if (addMessageDto.files) {
      for (const f of addMessageDto.files) {
        files.push({
          uuid: f,
        });
      }
    }

    const msgData: DeepPartial<ChatMessages> = {
      ...addMessageDto,
      chat: { id: chatId },
      type: messageType,
      user: { id: userId },
      files: files,
      metadata: metadata,
    };

    const msg = this.chatMessageRepository.create(msgData);
    const savedMsg = await queryRunner.manager.save(msg);
    return savedMsg;
  }

  async deleteMessageTx(
    queryRunner: QueryRunner,
    messageId: number,
    userId: number,
  ) {
    const chatMessage = await this.chatMessageRepository.findOne({
      where: { id: messageId },
    });

    if (!chatMessage) {
      throw new BadRequestException(ErrorTypes.CHAT_MESSAGE_NOT_FOUND);
    }

    if (chatMessage.userId !== userId) {
      throw new BadRequestException(
        ErrorTypes.CHAT_MESSAGE_AUTH_USER_NOT_OWNER_OF_MESSAGE,
      );
    }

    return await queryRunner.manager.remove(chatMessage);
  }

  async getUnreadCounts(chatIds: number[], userId: number) {
    let chatIdsArr = chatIds;
    if (!Array.isArray(chatIds)) {
      chatIdsArr = [chatIds];
    }

    const counts = await this.connection.manager.query(
      `
          select cp."chatId", count(*)
          from chat_participant cp
                   inner join chat_messages cm on cp."chatId" = cm."chatId"
          where cp."userId" = $1
            and cp."chatId" = any ($2)
            and cm.id > cp."readMessageId"
          group by cp."chatId";
      `,
      [userId, chatIdsArr],
    );

    return counts;
  }

  async getAllMessages(chatId: number, lastMessageId: number, userId: number) {
    const messages = await this.chatMessageRepository.find({
      where: {
        id: MoreThan(lastMessageId),
        chat: { id: chatId },
      },
      order: { id: 'ASC' },
      relations: ['files'],
    });

    const participationRecord = await this.chatParticipantRepository.findOne({
      where: {
        userId: userId,
        chatId: chatId,
      },
    });

    let lastReadMessageId = 0;
    if (participationRecord) {
      lastReadMessageId = participationRecord.readMessageId;
    }

    if (messages.length > 0) {
      const readMessageId = messages[messages.length - 1].id;
      await this.chatParticipantRepository.update(
        {
          userId: userId,
          chatId: chatId,
        },
        {
          readMessageId: readMessageId,
        },
      );
    }

    const count = await this.chatMessageRepository.count({
      where: {
        chat: { id: chatId },
      },
    });

    return {
      total: count,
      lastReadMessageId: lastReadMessageId,
      data: messages,
    };
  }

  async getParticipant(chatId: number, userId: number) {
    return await this.chatParticipantRepository.findOne({
      where: {
        userId: userId,
        chatId: chatId,
      },
    });
  }

  async getParticipantTx(
    queryRunner: QueryRunner,
    chatId: number,
    userId: number,
  ) {
    return await queryRunner.manager.findOne(ChatParticipant, {
      where: {
        userId: userId,
        chatId: chatId,
      },
    });
  }

  async getParticipants(chatId: number) {
    return await this.chatParticipantRepository.find({
      where: {
        chatId: chatId,
      },
    });
  }

  async getParticipantsTx(queryRunner: QueryRunner, chatId: number) {
    return await queryRunner.manager.find(ChatParticipant, {
      where: {
        chatId: chatId,
      },
    });
  }

  async addParticipant(chatId: number, userId: number) {
    const newParticipant = this.chatParticipantRepository.create();
    newParticipant.chat = { id: chatId };
    newParticipant.userId = userId;
    await this.chatParticipantRepository.save(newParticipant);

    // add system message
    await this.addMessage(
      { message: '' },
      MessageTypes.systemUserJoinedChat,
      chatId,
      null,
      {
        userId: userId,
      },
    );

    return newParticipant;
  }

  async addParticipantTx(
    queryRunner: QueryRunner,
    chatId: number,
    userId: number,
  ) {
    const newParticipant = this.chatParticipantRepository.create();
    newParticipant.chat = { id: chatId };
    newParticipant.userId = userId;
    await queryRunner.manager.save(newParticipant);

    // add system message
    await this.addMessageTx(
      queryRunner,
      { message: '' },
      MessageTypes.systemUserJoinedChat,
      chatId,
      null,
      {
        userId: userId,
      },
    );

    return newParticipant;
  }

  async setParticipant(chatId: number, userId: number, active: boolean) {
    const upd = await this.chatParticipantRepository.update(
      {
        userId,
        chatId,
      },
      {
        active,
      },
    );

    const status = active
      ? MessageTypes.systemUserJoinedChat
      : MessageTypes.systemUserLeftChat;

    // add system message
    await this.addMessage({ message: '' }, status, chatId, null, {
      userId: userId,
    });

    return upd;
  }

  async setParticipantTx(
    queryRunner: QueryRunner,
    chatId: number,
    userId: number,
    active: boolean,
  ) {
    const upd = await queryRunner.manager.update(
      ChatParticipant,
      {
        userId,
        chatId,
      },
      {
        active,
      },
    );

    const status = active
      ? MessageTypes.systemUserJoinedChat
      : MessageTypes.systemUserLeftChat;

    // add system message
    await this.addMessageTx(
      queryRunner,
      { message: '' },
      status,
      chatId,
      null,
      {
        userId: userId,
      },
    );

    return upd;
  }

  async changeRoleParticipant(userId: number, newRole: UserRole) {
    const updParticipant = await this.chatParticipantRepository.update(
      { userId },
      { role: newRole },
    );

    return updParticipant;
  }

  async removeMessageTx(queryRunner: QueryRunner, messageId: number) {
    return await queryRunner.manager.softDelete(ChatMessages, messageId);
  }

  async getMessage(messageId: number) {
    return await this.chatMessageRepository.findOne(messageId);
  }

  private async getMessagesByChatId(
    queryRunner: QueryRunner,
    chatId: number,
    limit: number,
    offset: number,
  ) {
    const messagesQuery = queryRunner.manager
      .createQueryBuilder()
      .select([
        'chat_messages.id as id',
        'chat_messages.createdAt as "createdAt"',
        'chat_messages.message as message',
        'chat_messages.userId as "userId"',
        'chat_messages.metadata as metadata',
        'chat_messages.type as type',
        'user.firstName as "firstName"',
        'user.lastName as "lastName"',
        'user.avatarImageUuid AS "avatarImageUuid"',
        'chat_participant.role as role',
      ])
      .from(ChatMessages, 'chat_messages')
      .where('chat_messages.chatId = :id', { id: chatId })
      .orderBy('chat_messages.createdAt', 'DESC');

    const total = await messagesQuery.getCount();

    const messages: UserMessageDto[] = await messagesQuery
      .innerJoin('user', 'user', 'user.id = chat_messages.userId')
      .innerJoin(
        'chat_participant',
        'chat_participant',
        'chat_participant.userId = user.id',
      )
      .skip(offset)
      .limit(limit)
      .getRawMany();

    const uniqueMessages: UserMessageDto[] = uniqBy(messages, 'id');
    uniqueMessages.sort((a, b) => +a.createdAt - +b.createdAt);
    for (const message of uniqueMessages) {
      message.files = await queryRunner.manager
        .createQueryBuilder()
        .select('chat_messages_files.fileUuid AS "fileUuid"')
        .from('chat_messages_files', 'chat_messages_files')
        .where('chat_messages_files.chatMessagesId = :id', { id: message.id })
        .getRawMany();
    }

    return {
      total,
      messages: uniqueMessages,
    };
  }
}
