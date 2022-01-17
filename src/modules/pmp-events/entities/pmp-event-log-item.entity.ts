import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PmpEvent } from './pmp-event.entity';
import { File } from '../../files/entities/file.entity';

@Entity()
export class PmpEventLogItem {
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

  @ManyToOne(() => PmpEvent, (pmpEvent) => pmpEvent.log)
  @JoinColumn()
  event: PmpEvent;

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

  @ManyToMany(() => File)
  @JoinTable()
  files: File[];

  toJSON() {
    return {
      id: this.id,
      date: this.createdAt,
      comment: this.comment,
      user: this.user,
      operation: this.operation,
      files: this.files,
    };
  }
}
