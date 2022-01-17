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
export class MaintenanceOperationLabel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: false })
  generateAlert: boolean;

  @ManyToOne(() => MaintenanceOperation, (operation) => operation.labels, {
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
      generateAlert: this.generateAlert,
    };
  }
}
