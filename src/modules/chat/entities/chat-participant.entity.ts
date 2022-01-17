import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Chat } from './chat.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from 'src/modules/authentication/enums/user-roles.enum';

@Entity()
export class ChatParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  public chatId!: number;

  @Column()
  public userId!: number;

  @Column({ default: 0 })
  public readMessageId!: number;

  @ManyToOne(() => Chat, (chat) => chat.chatParticipants)
  public chat!: { id: number };

  @ManyToOne(() => User, (user) => user.chats)
  public user!: User;

  @Column({ default: true })
  public active!: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.chatParticipant,
  })
  public role: UserRole;
}
