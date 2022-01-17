import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
} from '@nestjs/websockets';

import { WsClient } from '../interfaces';
import { WebsocketGateway } from '../websocket.gateway';
import { messengerEvents } from '../events';
import { createWebsocketResponse } from 'src/util/generateWebsocketResponse';
import { CreateChatDto } from '../dto/create-chat.dto';
import { GetChatDto } from '../dto/get-chat.dto';
import { CreateMessageDto } from '../dto/create-message.dto';
import { getChatListDto } from '../dto/get-chat-list.dto';
import { ChangeRoleDto } from '../dto/change-role.dto';
import { RemoveMessageDto } from '../dto/remove-message.dto';

@Injectable()
export class WebsocketMessengerGateway extends WebsocketGateway {
  @SubscribeMessage(messengerEvents.createChat)
  async addChat(
    @ConnectedSocket() client: WsClient,
    @MessageBody() payload: CreateChatDto,
  ) {
    const participantIds = [...payload.participantIds, client.userId];

    const userIds = participantIds.filter((item) => item !== client.userId);

    const chat = await this.messengerService.createChat(
      client.userId,
      participantIds,
      payload.chatTitle,
    );
    const message = JSON.stringify(chat);

    await this.messageToAllClientsByUserId(
      userIds,
      message,
      messengerEvents.createChat,
      client.userId,
      false,
    );

    return createWebsocketResponse(messengerEvents.createChat, chat);
  }

  @SubscribeMessage(messengerEvents.getChat)
  async getChat(
    @ConnectedSocket() client: WsClient,
    @MessageBody() payload: GetChatDto,
  ) {
    const chat = await this.messengerService.getChatById(
      client.userId,
      payload,
    );

    return createWebsocketResponse(messengerEvents.getChat, chat);
  }

  @SubscribeMessage(messengerEvents.getChats)
  async getChats(
    @ConnectedSocket() client: WsClient,
    @MessageBody() payload: getChatListDto,
  ) {
    let limit: number;
    let offset: number;
    if (!payload) {
      limit = 20;
      offset = 0;
    } else {
      limit = payload.limit ? payload.limit : 20;
      offset = payload.offset ? payload.offset : 0;
    }
    const chats = await this.messengerService.getChatList(client.userId, {
      limit,
      offset,
    });

    return createWebsocketResponse(messengerEvents.getChats, chats);
  }

  @SubscribeMessage(messengerEvents.sendMessage)
  async sendMessage(
    @ConnectedSocket() client: WsClient,
    @MessageBody() payload: CreateMessageDto,
  ) {
    const { chatParticipants, message, creator }: any =
      await this.messengerService.createMessage(client.userId, payload);

    const chatDto: GetChatDto = {
      limit: 1,
      chatId: payload.chatId,
      offset: 0,
    };

    const chat = await this.messengerService.getChatById(
      client.userId,
      chatDto,
    );
    const stringifyChat = JSON.stringify(chat);

    const userIds = chatParticipants.map((item) => item.userId);

    const messageResponse = {
      chatId: payload.chatId,
      creator,
      message,
    };
    const stringifyMessage = JSON.stringify(messageResponse);

    await this.messageToAllClientsByUserId(
      userIds,
      stringifyMessage,
      messengerEvents.sendMessage,
      client.userId,
      true,
    );

    await this.messageToAllClientsByUserId(
      userIds,
      stringifyChat,
      messengerEvents.chatUpdated,
      client.userId,
      true,
    );
  }

  @SubscribeMessage(messengerEvents.changeRoleParticipant)
  async changeRole(
    @ConnectedSocket() client: WsClient,
    @MessageBody() payload: ChangeRoleDto,
  ) {
    return await this.messengerService.changeRoleParticipant(
      client.userId,
      payload,
    );
  }

  @SubscribeMessage(messengerEvents.removeParticipant)
  async removeParticipant(
    @ConnectedSocket() client: WsClient,
    @MessageBody() participantId: number,
  ) {
    return await this.messengerService.removeParticipant(
      client.userId,
      participantId,
    );
  }

  @SubscribeMessage(messengerEvents.removeMessage)
  async removeMessage(
    @ConnectedSocket() client: WsClient,
    @MessageBody() payload: RemoveMessageDto,
  ) {
    const updatedChat = await this.messengerService.removeMessage(
      client.userId,
      payload,
    );

    if (!(updatedChat instanceof Error)) {
      const chatParticipants = updatedChat.chat.chatParticipants;
      const userIds = chatParticipants.map((participant) => participant.userId);
      const stringifyMessage = JSON.stringify(updatedChat);

      await this.messageToAllClientsByUserId(
        userIds,
        stringifyMessage,
        messengerEvents.removeMessage,
        client.userId,
        true,
      );
    }
  }
}
