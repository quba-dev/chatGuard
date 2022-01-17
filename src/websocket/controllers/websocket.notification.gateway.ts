import { Injectable } from '@nestjs/common';
import { WebsocketGateway } from '../websocket.gateway';

@Injectable()
export class WebsocketNotificationGateway extends WebsocketGateway {}
