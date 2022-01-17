import { UserRole } from '../../authentication/enums/user-roles.enum';

export class UserChatParticipantDto {
  readonly id: number;
  readonly active: boolean;
  readonly chatId: number;
  readonly readMessageId: number;
  readonly userId: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly avatarImageUuid: string | null;
}
