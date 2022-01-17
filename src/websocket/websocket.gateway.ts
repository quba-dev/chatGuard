import { Logger, UseFilters } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { v4 as uuid } from 'uuid';

import { WebsocketExceptionFilter } from './websocket.exception-filter';
import { WsClient } from './interfaces';
import { WebsocketMessengerService } from './services/websocket.messenger.service';

@UseFilters(new WebsocketExceptionFilter())
@WebSocketGateway({ path: '/ws' })
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private jwtService: JwtService,
    protected messengerService: WebsocketMessengerService,
  ) {}
  public connectedClients: Map<string, WsClient> = new Map();
  private logger: Logger = new Logger('WebSocketInit');

  handleDisconnect(client: WsClient) {
    const { id } = client;

    this.connectedClients.delete(id);

    this.logger.log(`client ${id} has disconnected`);
  }

  handleConnection(client: WsClient) {
    const connectedClient: any = {};

    connectedClient.client = client;
    connectedClient.id = uuid();
    client.id = connectedClient.id;

    const { protocol } = client;

    if (!protocol) {
      return;
    }

    const user = this.deserializeToken(protocol);

    if (!user) return;

    connectedClient.user = user;
    connectedClient.userId = user.id;
    client.userId = user.id;

    const existedClint = this.connectedClients.get(connectedClient.id);

    if (!existedClint) {
      this.connectedClients.set(connectedClient.id, connectedClient);
    }
    this.logger.log(`client ${connectedClient.id} connected`);
  }

  messageToClientByUserId(userId: number, event: string, message: string) {
    const parsedMessage = JSON.parse(message);

    this.connectedClients.forEach((wsClient) => {
      const { client } = <any>wsClient;

      if (client.userId === userId) {
        client.send(
          JSON.stringify({
            event,
            data: parsedMessage,
          }),
        );
      }
    });
  }

  messageToAllClientsByUserId(
    ids: number[],
    message: string,
    event: string,
    creatorId: number,
    sendCreator: boolean,
  ) {
    const parsedMessage = JSON.parse(message);
    this.connectedClients.forEach(async (wsClient) => {
      const { userId = null, client } = <any>wsClient;

      const sendAll = sendCreator && ids.includes(userId);
      const sendWEcreator = ids.includes(userId) && userId != creatorId;

      if (sendAll || sendWEcreator) {
        client.send(
          JSON.stringify({
            event,
            data: parsedMessage,
          }),
        );
      }
    });
  }

  deserializeToken(authHeader: string) {
    const token: string = authHeader?.split(' ')[1];
    if (!token) {
      return this.jwtService.decode(authHeader);
    }
    const user: any = this.jwtService.decode(token);
    return user;
  }
}
