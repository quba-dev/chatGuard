import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Subcontractor } from './subcontractor.entity';

@Entity()
export class SubcontractorCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

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

  @ManyToMany(
    () => Subcontractor,
    (subcontractor) => subcontractor.subcontractorCategories,
  )
  subcontractors: Subcontractor[];
}
