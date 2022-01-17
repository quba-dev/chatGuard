import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

import { Chat } from './chat.entity';
import { User } from '../../users/entities/user.entity';
import { MessageTypes } from '../enums/message-types.enum';
import { File } from '../../files/entities/file.entity';

@Entity()
export class ChatMessages {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: MessageTypes,
    default: MessageTypes.user,
  })
  type!: MessageTypes;

  @Column()
  public message!: string;

  @ManyToOne(() => Chat, (chat) => chat.messages)
  chat!: Chat;

  @Column({ nullable: true })
  public userId?: number;

  @ManyToOne(() => User)
  user!: User;

  @ManyToMany(() => File)
  @JoinTable({
    name: 'chat_messages_files',
  })
  files?: File[];

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata?;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt: Date;

  @DeleteDateColumn({
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt?: Date;
}
