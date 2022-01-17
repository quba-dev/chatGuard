import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BuildingLevel } from './building-level.entity';
import { TenantLocation } from './tenant-location.entity';

@Entity()
export class BuildingRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  positionIndex: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  description: string;

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

  @ManyToOne(() => BuildingLevel, (buildingLevel) => buildingLevel.rooms, {
    onDelete: 'CASCADE',
  })
  level: BuildingLevel;

  @ManyToMany(
    () => TenantLocation,
    (tenantLocation) => tenantLocation.buildingRooms,
  )
  tenantLocations: TenantLocation[];

  toJSON() {
    return {
      id: this.id,
      positionIndex: this.positionIndex,
      name: this.name,
      description: this.description,
    };
  }
}
