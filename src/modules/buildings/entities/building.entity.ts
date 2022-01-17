import { Project } from '../../projects/entities/project.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BuildingLevel } from './building-level.entity';

@Entity()
export class Building {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  positionIndex: number;

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

  @ManyToMany(() => BuildingLevel, (buildingLevel) => buildingLevel.buildings)
  @JoinTable()
  levels: BuildingLevel[];

  @ManyToOne(() => Project, (project) => project.buildings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  project: Project;

  toJSON() {
    return {
      id: this.id,
      positionIndex: this.positionIndex,
      name: this.name,
      levels: this.levels,
      project: this.project,
    };
  }
}
