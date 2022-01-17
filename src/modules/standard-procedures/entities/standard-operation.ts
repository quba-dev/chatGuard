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
import { StandardOperationLabel } from './standard-operation-label';
import { StandardOperationParameter } from './standard-operation-parameter';
import { StandardProcedure } from './standard-procedure';

@Entity()
export class StandardOperation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  uuid: string;

  @Column({ default: '' })
  description: string;

  @Column({ default: '' })
  type: string;

  @OneToMany(
    () => StandardOperationParameter,
    (parameter) => parameter.operation,
  )
  parameters: StandardOperationParameter[];

  @OneToMany(() => StandardOperationLabel, (label) => label.operation)
  labels: StandardOperationLabel[];

  @ManyToOne(() => StandardProcedure, (procedure) => procedure.operations)
  @JoinColumn()
  procedure: StandardProcedure;

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
