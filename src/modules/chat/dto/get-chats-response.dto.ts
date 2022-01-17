import { ChatResponseDto } from './chat-response.dto';
import { UserMessageDto } from './user-message.dto';

export class GetChatsResponseDto extends ChatResponseDto {
  lastMessage?: UserMessageDto;
}
