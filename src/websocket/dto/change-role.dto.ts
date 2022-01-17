import { UserRole } from 'src/modules/authentication/enums/user-roles.enum';

export class ChangeRoleDto {
  readonly chatId: number;
  readonly userId: number;
  readonly newRole: UserRole.chatAdmin | UserRole.chatParticipant;
}
