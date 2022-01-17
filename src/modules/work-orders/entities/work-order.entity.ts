import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WorkOrderStatus } from '../enum/work-order-status.enum';
import { Procurement } from '../../procurements/entities/procurement.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { Equipment } from '../../equipments/entities/equipment.entity';
import { Project } from '../../projects/entities/project.entity';
import { BuildingRoom } from '../../buildings/entities/building-room.entity';
import { BuildingLevel } from '../../buildings/entities/building-level.entity';
import { Building } from '../../buildings/entities/building.entity';

@Entity()
export class WorkOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.new,
  })
  status: WorkOrderStatus;

  @Column({ nullable: true, type: 'timestamptz' })
  dueDate: Date;

  @Column({ default: '' })
  subject: string;

  @Column({ default: '' })
  description: string;

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

  @ManyToMany(() => Procurement)
  @JoinTable()
  procurementOrders: Procurement[];

  @ManyToMany(() => Ticket)
  @JoinTable()
  tickets: Ticket[];

  @ManyToMany(() => Equipment)
  @JoinTable()
  equipments: Equipment[];

  @ManyToMany(() => User, (user) => user.workOrders)
  @JoinTable()
  users: User[];
}
