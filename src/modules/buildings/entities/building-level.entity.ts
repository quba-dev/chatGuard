import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BuildingRoom } from './building-room.entity';
import { Building } from './building.entity';

@Entity()
export class BuildingLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  positionIndex: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: false })
  isSubLevel: boolean;

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

  @OneToMany(() => BuildingRoom, (buildingRoom) => buildingRoom.level)
  rooms: BuildingRoom[];

  @ManyToMany(() => Building, (building) => building.levels, {
    onDelete: 'CASCADE',
  })
  buildings: Building[];

  toJSON() {
    return {
      id: this.id,
      positionIndex: this.positionIndex,
      isSubLevel: this.isSubLevel,
      name: this.name,
      rooms: this.rooms,
      buildings: this.buildings,
    };
  }
}
