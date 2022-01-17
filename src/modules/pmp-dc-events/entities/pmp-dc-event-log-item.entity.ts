import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PmpDCEvent } from './pmp-dc-event.entity';

@Entity()
export class PmpDCEventLogItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  comment: string;

  @Column({
    type: 'jsonb',
    default: '{}',
  })
  operation: {};

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @ManyToOne(() => PmpDCEvent, (pmpEvent) => pmpEvent.log)
  @JoinColumn()
  event: PmpDCEvent;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  updatedAt: Date;

  toJSON() {
    return {
      id: this.id,
      date: this.createdAt,
      comment: this.comment,
      user: this.user,
      operation: this.operation,
    };
  }
}
