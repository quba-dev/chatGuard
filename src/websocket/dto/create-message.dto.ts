import { AddMessageDto } from '../../modules/chat/dto/add-message.dto';

export class CreateMessageDto extends AddMessageDto {
  readonly chatId: number;
}
