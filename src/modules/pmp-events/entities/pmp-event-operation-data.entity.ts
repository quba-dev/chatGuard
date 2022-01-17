import { MaintenanceOperationLabel } from '../../maintenance-procedures/entities/maintenance-operation-label';
import { MaintenanceOperationParameter } from '../../maintenance-procedures/entities/maintenance-operation-parameter';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { PmpEvent } from './pmp-event.entity';
import { MaintenanceOperation } from '../../maintenance-procedures/entities/maintenance-operation';
import { File } from '../../files/entities/file.entity';

@Entity()
export class PmpEventOperationData {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PmpEvent, (pmpEvent) => pmpEvent.measurements)
  @JoinColumn()
  event: PmpEvent;

  @Column({ nullable: true })
  operationId: number;

  @ManyToOne(() => MaintenanceOperation)
  @JoinColumn()
  operation: MaintenanceOperation;

  @ManyToMany(() => File)
  @JoinTable()
  files: File[];

  @Column({ default: '' })
  feedback: string;

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
      operationId: this.operationId,
      feedback: this.feedback,
      files: this.files,
    };
  }
}
