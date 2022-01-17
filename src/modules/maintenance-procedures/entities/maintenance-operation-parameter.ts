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
import { MaintenanceOperation } from './maintenance-operation';

@Entity()
export class MaintenanceOperationParameter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @ManyToOne(() => Unit)
  @JoinColumn()
  unit: Unit;

  @Column({ default: 0 })
  minValue: number;

  @Column({ default: 0 })
  maxValue: number;

  @ManyToOne(() => MaintenanceOperation, (operation) => operation.parameters, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  operation: MaintenanceOperation;

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
      name: this.name,
      unit: this.unit,
      minValue: this.minValue,
      maxValue: this.maxValue,
    };
  }
}
