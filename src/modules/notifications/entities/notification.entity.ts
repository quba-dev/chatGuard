import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NotificationTypes } from '../enums/notification-types.enum';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: NotificationTypes,
  })
  type!: NotificationTypes;

  @Column({ nullable: true })
  public creatorId?: number;

  @ManyToOne(() => User)
  creator!: User;

  @Column({ nullable: true })
  public userId?: number;

  @ManyToOne(() => User)
  user!: User;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata?;

  @Column({ default: false })
  acknowledged!: boolean;

  @Column({ default: false })
  notified!: boolean;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt: Date;

  toJSON() {
    return {
      id: this.id,
      creatorId: this.creatorId,
      type: this.type,
      metadata: this.metadata,
      createdAt: this.createdAt,
    };
  }
}
