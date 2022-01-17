import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Equipment } from './equipment.entity';
import { Project } from '../../projects/entities/project.entity';
import { EquipmentCategoryGroup } from './equipment-category-group.entity';

@Entity()
export class EquipmentProjectCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @ManyToOne(() => Project, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  project: Project;

  @OneToMany(() => Equipment, (equipment) => equipment.projectCategory)
  equipment: Equipment;

  @OneToMany(
    () => EquipmentCategoryGroup,
    (equipmentCategoryGroup) => equipmentCategoryGroup.equipmentProjectCategory,
  )
  equipmentCategoryGroups: EquipmentCategoryGroup[];

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
      equipmentCategoryGroups: this.equipmentCategoryGroups,
    };
  }
}
