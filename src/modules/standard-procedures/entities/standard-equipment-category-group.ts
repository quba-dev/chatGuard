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
import { StandardEquipmentCategory } from './standard-equipment-category';
import { StandardProcedure } from './standard-procedure';

@Entity()
export class StandardEquipmentCategoryGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  uuid: string;

  @ManyToOne(
    () => StandardEquipmentCategory,
    (category) => category.categoryGroups,
  )
  @JoinColumn()
  category: StandardEquipmentCategory;

  @OneToMany(() => StandardProcedure, (procedure) => procedure.categoryGroup)
  procedures: StandardProcedure[];

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
    };
  }
}
