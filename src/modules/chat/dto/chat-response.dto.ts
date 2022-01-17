import { UserChatParticipantDto } from './user-chat-participant.dto';

export class ChatResponseDto {
  readonly id: number;
  readonly chatTitle: string | null;
  readonly avatarUrl: string;
  chatParticipants: UserChatParticipantDto[];
}
