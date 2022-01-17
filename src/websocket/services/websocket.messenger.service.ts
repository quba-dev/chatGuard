import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { WsException } from '@nestjs/websockets';

import { ChatService } from 'src/modules/chat/chat.service';
import { ChatTypes } from 'src/modules/chat/enums/chat-types.enum';
import { Chat } from 'src/modules/chat/entities/chat.entity';
import { ChatRoles } from 'src/modules/authentication/enums/user-roles.enum';
import { ChatParticipant } from 'src/modules/chat/entities/chat-participant.entity';
import { createWebsocketError } from 'src/util/generateWebsocketResponse';
import { MessageTypes } from 'src/modules/chat/enums/message-types.enum';
import { GetChatDto } from '../dto/get-chat.dto';
import { CreateMessageDto } from '../dto/create-message.dto';
import { getChatListDto } from '../dto/get-chat-list.dto';
import { ChangeRoleDto } from '../dto/change-role.dto';
import { RemoveMessageDto } from '../dto/remove-message.dto';
import { messengerEvents } from '../events';

@Injectable()
export class WebsocketMessengerService {
  maxPrivateChatUsers = 2;
  constructor(
    private connection: Connection,
    private chatService: ChatService,
  ) {}

  async createChat(
    clientId: number,
    participantIds: number[],
    chatTitle?: string,
  ) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let chatType = ChatTypes.privateChat;

      if (participantIds.length > this.maxPrivateChatUsers) {
        chatType = ChatTypes.groupChat;

        if (!chatTitle) {
          throw Error('chatTitle is not provided');
        }
      }

      const newChat = await this.chatService.create(
        queryRunner,
        participantIds,
        chatType,
        chatTitle,
        clientId,
      );

      await queryRunner.commitTransaction();
      const limit = 1;
      const offset = 0;

      return await this.chatService.getChatByIdTx(
        newChat.id,
        clientId,
        limit,
        offset,
      );
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      const errorResponse = JSON.stringify(
        createWebsocketError(messengerEvents.createChat, err.message),
      );
      throw new WsException(errorResponse);
    } finally {
      await queryRunner.release();
    }
  }

  async getChatById(
    clientId: number,
    { limit = 20, chatId, offset = 0 }: GetChatDto,
  ) {
    try {
      if (!chatId) {
        throw Error('chatId is not provided');
      }

      const chat = await this.chatService.getChatByIdTx(
        chatId,
        clientId,
        limit,
        offset,
      );

      if (chat instanceof Error) {
        throw Error(chat.message);
      }

      return {
        ...chat,
        offset,
        limit,
      };
    } catch (err) {
      console.error(err);
      const errorResponse = JSON.stringify(
        createWebsocketError(messengerEvents.getChat, err.message),
      );
      throw new WsException(errorResponse);
    }
  }

  async getChatList(clientId: number, dto: getChatListDto) {
    return await this.chatService.getChatList(clientId, dto);
  }

  async createMessage(
    clientId: number,
    { chatId, message, files }: CreateMessageDto,
  ) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!chatId) {
        throw Error('chatId is not provided');
      }
      if (!message) {
        throw Error('message is not provided');
      }

      const chat = await queryRunner.manager.findOne(Chat, {
        where: { id: chatId },
        relations: ['chatParticipants'],
      });
      if (!chat) {
        throw Error(`chat with chatId: ${chatId} doesn't exist`);
      }
      const { chatParticipants } = chat;
      const currentUserInChat = chatParticipants.find(
        (chatParticipant) => chatParticipant.userId === clientId,
      );
      if (!currentUserInChat) {
        throw Error(`user doesn't participate chat with chatId: ${chatId}`);
      }
      const creator = await this.chatService.getUserChatParticipant(
        queryRunner,
        chat.id,
        clientId,
      );

      const messageRes = await this.chatService.addMessageTx(
        queryRunner,
        { message, files },
        MessageTypes.user,
        chatId,
        clientId,
      );

      await queryRunner.commitTransaction();

      return {
        chatParticipants,
        creator,
        message: messageRes,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      const errorResponse = JSON.stringify(
        createWebsocketError(messengerEvents.sendMessage, err.message),
      );
      throw new WsException(errorResponse);
    } finally {
      await queryRunner.release();
    }
  }

  async changeRoleParticipant(
    clientId: number,
    { newRole, chatId, userId }: ChangeRoleDto,
  ) {
    try {
      if (!newRole) {
        throw Error('newRole is not provided');
      }
      if (!chatId) {
        throw Error('chatId is not provided');
      }
      if (!ChatRoles.includes(newRole)) {
        throw Error(`role: '${newRole}' isn't correct`);
      }

      const chat = await this.chatService.getChatById(chatId);
      if (!chat) {
        throw Error(`chat doesn't exist with id: ${chatId}`);
      }
      if (chat.type !== ChatTypes.groupChat) {
        throw Error('This is only available for group chat');
      }

      const currentUserInChat = await this.chatService.getParticipant(
        chatId,
        userId,
      );
      if (!currentUserInChat) {
        throw Error(
          `chat with id: ${chatId} doesn't contain, user with id: ${userId}`,
        );
      }

      await this.chatService.changeRoleParticipant(userId, newRole);

      return await this.chatService.getParticipant(chatId, userId);
    } catch (err) {
      console.error(err);
      const errorResponse = JSON.stringify(
        createWebsocketError(
          messengerEvents.changeRoleParticipant,
          err.message,
        ),
      );
      throw new WsException(errorResponse);
    }
  }

  async removeParticipant(clientId: number, participantId: number) {
    if (!participantId) {
      return createWebsocketError(
        messengerEvents.removeParticipant,
        'participantId is not provided',
      );
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const currentUserInChat = await queryRunner.manager.findOne(
        ChatParticipant,
        { where: { id: participantId } },
      );
      if (!currentUserInChat) {
        return createWebsocketError(
          messengerEvents.removeParticipant,
          `user doesn't exist with participantId: : ${participantId}`,
        );
      }
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      const errorResponse = JSON.stringify(
        createWebsocketError(messengerEvents.removeParticipant, err.message),
      );
      throw new WsException(errorResponse);
    } finally {
      await queryRunner.release();
    }
  }

  async removeMessage(clientId: number, dto: RemoveMessageDto) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!dto.messageId) {
        throw Error('messageId is not provided');
      }
      if (!dto.chatId) {
        throw Error('chatId is not provided');
      }

      const currentChat = await this.chatService.getChatById(dto.chatId);
      if (!currentChat) {
        throw Error(`chat doesn't exist with id: ${dto.chatId}`);
      }

      const currentMessage = await this.chatService.getMessageByChatId(
        dto.chatId,
        dto.messageId,
      );
      if (!currentMessage) {
        throw Error(
          `chat with id: ${dto.chatId} doesn't contain, message with id: ${dto.messageId}`,
        );
      }

      const deletionRes = await this.chatService.removeMessageTx(
        queryRunner,
        dto.messageId,
      );
      if (!deletionRes.affected) {
        throw Error('failed to delete message');
      }
      await queryRunner.commitTransaction();

      const limit = 20;
      const offset = 0;

      const chat = await this.chatService.getChatByIdTx(
        dto.chatId,
        clientId,
        limit,
        offset,
      );

      return chat;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      const errorResponse = JSON.stringify(
        createWebsocketError(messengerEvents.removeMessage, err.message),
      );
      throw new WsException(errorResponse);
    } finally {
      await queryRunner.release();
    }
  }
}
