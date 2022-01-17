import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch()
export class WebsocketExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    let error;
    try {
      error = exception.getError();
    } catch (e) {
      error = e.message;
    }
    // @ts-ignore
    host.getClient().send(error);
  }
}
