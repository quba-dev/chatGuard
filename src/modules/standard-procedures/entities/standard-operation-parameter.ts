import { Unit } from '../../units/entities/unit';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StandardOperation } from './standard-operation';

@Entity()
export class StandardOperationParameter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  uuid: string;

  @ManyToOne(() => Unit)
  @JoinColumn()
  unit: Unit;

  @ManyToOne(() => StandardOperation, (operation) => operation.parameters)
  @JoinColumn()
  operation: StandardOperation;

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
