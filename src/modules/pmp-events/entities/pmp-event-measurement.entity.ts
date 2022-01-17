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
  OneToMany,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { PmpEvent } from './pmp-event.entity';
import { MaintenanceOperation } from '../../maintenance-procedures/entities/maintenance-operation';
import { File } from '../../files/entities/file.entity';

@Entity()
export class PmpEventMeasurement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PmpEvent, (pmpEvent) => pmpEvent.measurements)
  @JoinColumn()
  event: PmpEvent;

  @Column({ nullable: true })
  operationId: number;
  @Column({ nullable: true })
  labelId: number;
  @Column({ nullable: true })
  parameterId: number;

  @ManyToOne(() => MaintenanceOperation)
  @JoinColumn()
  operation: MaintenanceOperation;

  @ManyToOne(() => MaintenanceOperationLabel)
  @JoinColumn()
  label: MaintenanceOperationLabel;

  @ManyToOne(() => MaintenanceOperationParameter)
  @JoinColumn()
  parameter: MaintenanceOperationParameter;

  @ManyToMany(() => File)
  @JoinTable()
  files: File[];

  @Column({ default: 0 })
  parameterValue: number;

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
      labelId: this.labelId,
      parameterId: this.parameterId,
      parameterValue: this.parameterValue,
      feedback: this.feedback,
      files: this.files,
    };
  }
}
