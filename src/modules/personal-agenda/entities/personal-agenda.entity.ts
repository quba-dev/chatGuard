import { User } from '../../users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PersonalAgenda {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: true,
    type: 'timestamptz',
  })
  timestamp_start: Date;

  @Column({
    nullable: true,
    type: 'timestamptz',
  })
  timestamp_end: Date;

  @Column({
    nullable: true,
    type: 'timestamptz',
  })
  timestamp_reminder: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  timestamp_updated: Date;

  @Column({ nullable: true })
  userId: number;

  @Column({ default: '' })
  title: string;

  @Column({ default: '' })
  body: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;
}
