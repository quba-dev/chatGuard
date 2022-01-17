import { Project } from '../../projects/entities/project.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { MaintenanceProcedure } from '../../maintenance-procedures/entities/maintenance-procedure';
import { PmpEventMeasurement } from './pmp-event-measurement.entity';
import { PmpEventStatus } from '../enums/pmp-event-status';
import { PmpEventLogItem } from './pmp-event-log-item.entity';
import { File } from '../../files/entities/file.entity';
import { PmpEventOperationData } from './pmp-event-operation-data.entity';

@Entity()
export class PmpEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  date: Date;

  @ManyToOne(() => MaintenanceProcedure, {
    onDelete: 'CASCADE',
  })
  procedure: MaintenanceProcedure;

  @OneToMany(
    () => PmpEventMeasurement,
    (pmpEventMeasurement) => pmpEventMeasurement.event,
  )
  measurements: PmpEventMeasurement[];

  @OneToMany(
    () => PmpEventOperationData,
    (pmpEventOperationData) => pmpEventOperationData.event,
  )
  operationsData: PmpEventOperationData[];

  @OneToMany(() => PmpEventLogItem, (pmpEventLogItem) => pmpEventLogItem.event)
  log: PmpEventLogItem[];

  @ManyToOne(() => Project, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @Column({
    type: 'enum',
    enum: PmpEventStatus,
    default: PmpEventStatus.planned,
  })
  status: PmpEventStatus;

  @ManyToMany(() => File)
  @JoinTable()
  files: File[];

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
      date: this.date,
      procedure: this.procedure,
      status: this.status,
      measurements: this.measurements,
      operationsData: this.operationsData,
      log: this.log,
      files: this.files,
    };
  }
}
