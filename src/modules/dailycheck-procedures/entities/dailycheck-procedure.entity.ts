import { Equipment } from '../../equipments/entities/equipment.entity';
import { Project } from '../../projects/entities/project.entity';
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
import { DailycheckOperation } from './dailycheck-operation.entity';
import { EquipmentCategoryGroup } from '../../equipments/entities/equipment-category-group.entity';
import { DailycheckGroup } from './dailycheck-group.entity';

@Entity()
export class DailycheckProcedure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  description: string;

  @OneToMany(() => DailycheckOperation, (operation) => operation.procedure, {
    onDelete: 'CASCADE',
  })
  operations: DailycheckOperation[];

  @ManyToOne(() => Equipment, (equipment) => equipment.dailycheckProcedures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  equipment: Equipment;

  @ManyToOne(
    () => EquipmentCategoryGroup,
    (equipmentCategoryGroup) => equipmentCategoryGroup.dailycheckProcedures,
  )
  @JoinColumn()
  equipmentCategoryGroup: EquipmentCategoryGroup;

  @ManyToOne(() => Project, (project) => project.dailycheckProcedures)
  @JoinColumn()
  project: Project;

  @ManyToOne(
    () => DailycheckGroup,
    (dailycheckGroup) => dailycheckGroup.dailycheckProcedures,
  )
  @JoinColumn()
  group: DailycheckGroup;

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
      description: this.description,
      operations: this.operations,
      equipmentCategoryGroup: this.equipmentCategoryGroup,
      equipment: this.equipment,
      group: this.group,
    };
  }
}
