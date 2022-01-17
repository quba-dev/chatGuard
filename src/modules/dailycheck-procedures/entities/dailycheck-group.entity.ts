import { BuildingLevel } from '../../buildings/entities/building-level.entity';
import { BuildingRoom } from '../../buildings/entities/building-room.entity';
import { Building } from '../../buildings/entities/building.entity';
import { Project } from '../../projects/entities/project.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DailycheckProcedure } from './dailycheck-procedure.entity';

@Entity()
export class DailycheckGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @ManyToOne(() => Project, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  project: Project;

  @Column()
  projectId: number;

  @OneToMany(
    () => DailycheckProcedure,
    (dailycheckProcedure) => dailycheckProcedure.group,
  )
  dailycheckProcedures: DailycheckProcedure;

  @ManyToOne(() => Building)
  @JoinColumn()
  building: Building;

  @ManyToOne(() => BuildingLevel)
  @JoinColumn()
  buildingLevel: BuildingLevel;

  @ManyToMany(() => BuildingRoom)
  @JoinTable()
  buildingRooms: BuildingRoom[];

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
      building: this.building,
      buildingLevel: this.buildingLevel,
      buildingRooms: this.buildingRooms,
    };
  }
}
