import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DailycheckOperation } from './dailycheck-operation.entity';

@Entity()
export class DailycheckOperationLabel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: false })
  generateAlert: boolean;

  @ManyToOne(() => DailycheckOperation, (operation) => operation.labels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  operation: DailycheckOperation;

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
