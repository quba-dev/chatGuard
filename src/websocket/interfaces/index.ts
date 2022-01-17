export interface WsClient extends WebSocket {
  id: string;
  userId: number;
}

export interface WebsocketErrorResponse {
  event: string;
  data: {
    error: string;
  };
}
