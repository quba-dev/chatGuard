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
import { PmpDCEvent } from './pmp-dc-event.entity';
import { File } from '../../files/entities/file.entity';
import { DailycheckOperation } from '../../dailycheck-procedures/entities/dailycheck-operation.entity';

@Entity()
export class PmpDCEventOperationData {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PmpDCEvent, (pmpEvent) => pmpEvent.measurements)
  @JoinColumn()
  event: PmpDCEvent;

  @Column({ nullable: true })
  operationId: number;

  @ManyToOne(() => DailycheckOperation)
  @JoinColumn()
  operation: DailycheckOperation;

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
