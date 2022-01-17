import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MaintenanceOperationLabel } from './maintenance-operation-label';
import { MaintenanceOperationParameter } from './maintenance-operation-parameter';
import { MaintenanceProcedure } from './maintenance-procedure';

@Entity()
export class MaintenanceOperation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  description: string;

  @Column({ default: '' })
  type: string;

  @OneToMany(
    () => MaintenanceOperationParameter,
    (parameter) => parameter.operation,
  )
  parameters: MaintenanceOperationParameter[];

  @OneToMany(() => MaintenanceOperationLabel, (label) => label.operation)
  labels: MaintenanceOperationLabel[];

  @ManyToOne(() => MaintenanceProcedure, (procedure) => procedure.operations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  procedure: MaintenanceProcedure;

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
      type: this.type,
      description: this.description,
      labels: this.labels,
      parameters: this.parameters,
    };
  }
}
