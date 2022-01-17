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
import { EquipmentProjectCategory } from './equipment-project-category.entity';
import { DailycheckProcedure } from '../../dailycheck-procedures/entities/dailycheck-procedure.entity';

@Entity()
export class EquipmentCategoryGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @ManyToOne(() => Project, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  project: Project;

  @ManyToOne(() => EquipmentProjectCategory)
  @JoinColumn()
  equipmentProjectCategory: EquipmentProjectCategory;

  @OneToMany(() => Equipment, (equipment) => equipment.categoryGroup)
  equipments: Equipment[];

  @OneToMany(
    () => DailycheckProcedure,
    (dailycheckProcedure) => dailycheckProcedure.equipmentCategoryGroup,
  )
  dailycheckProcedures: DailycheckProcedure[];

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
      equipmentProjectCategory: this.equipmentProjectCategory,
      equipments: this.equipments,
    };
  }
}
