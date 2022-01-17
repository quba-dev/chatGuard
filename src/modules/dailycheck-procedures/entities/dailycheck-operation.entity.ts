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
import { DailycheckOperationLabel } from './dailycheck-operation-label.entity';
import { DailycheckOperationParameter } from './dailycheck-operation-parameter.entity';
import { DailycheckProcedure } from './dailycheck-procedure.entity';

@Entity()
export class DailycheckOperation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  description: string;

  @Column({ default: '' })
  type: string;

  @OneToMany(
    () => DailycheckOperationParameter,
    (parameter) => parameter.operation,
  )
  parameters: DailycheckOperationParameter[];

  @OneToMany(() => DailycheckOperationLabel, (label) => label.operation)
  labels: DailycheckOperationLabel[];

  @ManyToOne(() => DailycheckProcedure, (procedure) => procedure.operations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  procedure: DailycheckProcedure;

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
