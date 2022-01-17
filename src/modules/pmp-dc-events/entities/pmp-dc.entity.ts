import { Project } from '../../projects/entities/project.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PmpDCEvent } from './pmp-dc-event.entity';

@Entity()
export class PmpDC {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  date: Date;

  @OneToMany(() => PmpDCEvent, (pmpDCEvent) => pmpDCEvent.dailyCheck)
  events: PmpDCEvent[];

  @ManyToOne(() => Project)
  @JoinColumn()
  project: Project;

  @Column({ default: false })
  validated: boolean;

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
      date: this.date,
      events: this.events,
      validated: this.validated,
    };
  }
}
