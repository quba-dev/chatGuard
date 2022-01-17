import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TicketStatus } from '../enum/ticket-status.enum';
import { TicketPriority } from '../enum/ticket-priority.enum';
import { Chat } from '../../chat/entities/chat.entity';
import { Project } from '../../projects/entities/project.entity';
import { Building } from '../../buildings/entities/building.entity';
import { BuildingLevel } from '../../buildings/entities/building-level.entity';
import { BuildingRoom } from '../../buildings/entities/building-room.entity';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.new,
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.noPriority,
  })
  priority: TicketPriority;

  @Column({ nullable: true, type: 'timestamptz' })
  dueDate: Date;

  @ManyToOne(() => User)
  @JoinColumn()
  creator: User;

  @ManyToOne(() => User)
  @JoinColumn()
  recipient: User;

  @Column({ default: '' })
  subject: string;

  @Column({ default: '' })
  description: string;

  @Column({ default: '' })
  contact: string;

  @Column()
  public projectId!: number;

  @ManyToOne(() => Project)
  @JoinColumn()
  project: Project;

  @ManyToOne(() => Building)
  @JoinColumn()
  building: Building;

  @ManyToOne(() => BuildingLevel)
  @JoinColumn()
  buildingLevel: BuildingLevel;

  @ManyToMany(() => BuildingRoom)
  @JoinTable()
  buildingRooms: BuildingRoom[];

  @Column()
  public externalChatId!: number;

  @OneToOne(() => Chat)
  @JoinColumn()
  externalChat: Chat;

  @Column()
  public internalChatId!: number;

  @OneToOne(() => Chat)
  @JoinColumn()
  internalChat: Chat;

  @Column({ nullable: true, type: 'timestamptz' })
  public openedAt: Date;

  @Column({ nullable: true })
  public rating: number;

  @Column({
    type: 'timestamptz',
    default: () => 'now()',
  })
  statusUpdatedAt: Date;

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
}
