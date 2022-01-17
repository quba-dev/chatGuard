import { City } from '../../geoLocation/entities/city.entity';
import { Country } from '../../geoLocation/entities/country.entity';
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
import { ProcurementStatus } from '../enum/procurement-status.enum';
import { Chat } from '../../chat/entities/chat.entity';
import { Project } from '../../projects/entities/project.entity';
import { Building } from '../../buildings/entities/building.entity';
import { BuildingLevel } from '../../buildings/entities/building-level.entity';
import { BuildingRoom } from '../../buildings/entities/building-room.entity';
import { Currency } from '../enum/currency.enum';
import { File } from '../../files/entities/file.entity';
import { Equipment } from '../../equipments/entities/equipment.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity()
export class Procurement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ProcurementStatus,
    default: ProcurementStatus.new,
  })
  status: ProcurementStatus;

  @ManyToOne(() => User)
  @JoinColumn()
  creator: User;

  @ManyToMany(() => Ticket)
  @JoinTable()
  tickets: Ticket[];

  @ManyToMany(() => Equipment)
  @JoinTable()
  equipments: Equipment[];

  @ManyToOne(() => User)
  @JoinColumn()
  recipient: User;

  @Column({ default: '' })
  subject: string;

  @Column({ default: '' })
  description: string;

  @ManyToOne(() => Project)
  @JoinColumn()
  project: Project;

  @Column()
  public projectId!: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.RON,
  })
  proposalCurrency: Currency;

  @Column({
    default: 0,
  })
  proposalAmount: number;

  @OneToOne(() => File)
  @JoinColumn()
  proposalFile: File;

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
