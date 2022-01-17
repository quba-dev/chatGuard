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
export class StandardOperationLabel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  uuid: string;

  @Column({ default: false })
  generateAlert: boolean;

  @ManyToOne(() => StandardOperation, (operation) => operation.labels)
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
