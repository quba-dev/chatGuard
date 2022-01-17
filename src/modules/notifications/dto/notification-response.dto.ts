import { NotificationTypes } from '../enums/notification-types.enum';

export class NotificationResponseDto {
  readonly id: number;
  readonly creatorId: number;
  readonly createdAt: Date;
  readonly type: NotificationTypes;
  readonly creatorFirstName: string;
  readonly creatorLastName: string;
  readonly metadata: any;
}
