import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatParticipant } from './chat-participant.entity';
import { ChatMessages } from './chat-message.entity';
import { ChatTypes } from '../enums/chat-types.enum';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ChatTypes,
  })
  type!: ChatTypes;

  @OneToMany(() => ChatParticipant, (chatParticipants) => chatParticipants.chat)
  public chatParticipants!: ChatParticipant[];

  @OneToMany(() => ChatMessages, (messages) => messages.chat)
  messages?: ChatMessages[];

  @Column({ nullable: true, default: null })
  chatTitle?: string;

  @Column({ default: '' })
  avatarUrl: string;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      chatTitle: this.chatTitle,
      avatarUrl: this.avatarUrl,
      chatParticipants: this.chatParticipants,
      messages: this.messages,
    };
  }
}
