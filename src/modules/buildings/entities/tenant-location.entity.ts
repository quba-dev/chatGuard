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
import { BuildingRoom } from './building-room.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Building } from './building.entity';

@Entity()
export class TenantLocation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  project: Project;

  @Column()
  projectId: number;

  @ManyToOne(() => Organization, (organization) => organization.locations)
  @JoinColumn()
  organization: Organization;

  @ManyToOne(() => Building)
  @JoinColumn()
  building: Building;
  @Column()
  buildingId: number;

  @ManyToOne(() => BuildingLevel)
  @JoinColumn()
  buildingLevel: BuildingLevel;
  @Column()
  buildingLevelId: number;

  @ManyToMany(
    () => BuildingRoom,
    (buildingRoom) => buildingRoom.tenantLocations,
  )
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
      building: this.building,
      buildingLevel: this.buildingLevel,
      buildingRooms: this.buildingRooms,
    };
  }
}
