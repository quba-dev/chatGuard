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
  JoinColumn,
} from 'typeorm';
import { PmpDCEventMeasurement } from './pmp-dc-event-measurement.entity';
import { PmpDCEventStatus } from '../enums/pmp-dc-event-status';
import { PmpDCEventLogItem } from './pmp-dc-event-log-item.entity';
import { File } from '../../files/entities/file.entity';
import { PmpDCEventOperationData } from './pmp-dc-event-operation-data.entity';
import { DailycheckProcedure } from '../../dailycheck-procedures/entities/dailycheck-procedure.entity';
import { PmpDC } from './pmp-dc.entity';

@Entity()
export class PmpDCEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  date: Date;

  @ManyToOne(() => PmpDC, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  dailyCheck: PmpDC;

  @ManyToOne(() => DailycheckProcedure, {
    onDelete: 'CASCADE',
  })
  procedure: DailycheckProcedure;

  @OneToMany(
    () => PmpDCEventMeasurement,
    (pmpDCEventMeasurement) => pmpDCEventMeasurement.event,
  )
  measurements: PmpDCEventMeasurement[];

  @OneToMany(
    () => PmpDCEventOperationData,
    (pmpEventOperationData) => pmpEventOperationData.event,
  )
  operationsData: PmpDCEventOperationData[];

  @OneToMany(
    () => PmpDCEventLogItem,
    (pmpEventLogItem) => pmpEventLogItem.event,
  )
  log: PmpDCEventLogItem[];

  @ManyToOne(() => Project, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @Column({
    type: 'enum',
    enum: PmpDCEventStatus,
    default: PmpDCEventStatus.planned,
  })
  status: PmpDCEventStatus;

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
