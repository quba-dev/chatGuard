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
import { PmpDCEvent } from './pmp-dc-event.entity';
import { File } from '../../files/entities/file.entity';
import { DailycheckOperation } from '../../dailycheck-procedures/entities/dailycheck-operation.entity';
import { DailycheckOperationLabel } from '../../dailycheck-procedures/entities/dailycheck-operation-label.entity';
import { DailycheckOperationParameter } from '../../dailycheck-procedures/entities/dailycheck-operation-parameter.entity';

@Entity()
export class PmpDCEventMeasurement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PmpDCEvent, (pmpDCEvent) => pmpDCEvent.measurements)
  @JoinColumn()
  event: PmpDCEvent;

  @Column({ nullable: true })
  operationId: number;
  @Column({ nullable: true })
  labelId: number;
  @Column({ nullable: true })
  parameterId: number;

  @ManyToOne(() => DailycheckOperation)
  @JoinColumn()
  operation: DailycheckOperation;

  @ManyToOne(() => DailycheckOperationLabel)
  @JoinColumn()
  label: DailycheckOperationLabel;

  @ManyToOne(() => DailycheckOperationParameter)
  @JoinColumn()
  parameter: DailycheckOperationParameter;

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
