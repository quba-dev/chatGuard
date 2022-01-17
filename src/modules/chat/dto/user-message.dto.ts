import { UserRole } from '../../authentication/enums/user-roles.enum';

export class UserMessageDto {
  readonly id: number;
  readonly createdAt: Date;
  readonly message: string;
  readonly userId: number;
  readonly metadata: any;
  readonly type: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly avatarImageUuid: string | null;
  readonly role: UserRole;
  files: Array<{ fileUuid: string }>;
}
