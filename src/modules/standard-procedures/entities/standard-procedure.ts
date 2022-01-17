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
import { StandardEquipmentCategoryGroup } from './standard-equipment-category-group';
import { StandardOperation } from './standard-operation';

@Entity()
export class StandardProcedure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  uuid: string;

  @Column({ default: '' })
  type: string;

  @Column({ default: '' })
  subType: string;

  @Column({ default: '' })
  frequency: string;

  @OneToMany(() => StandardOperation, (operation) => operation.procedure)
  operations: StandardOperation[];

  @ManyToOne(
    () => StandardEquipmentCategoryGroup,
    (categoryGroup) => categoryGroup.procedures,
  )
  @JoinColumn()
  categoryGroup: StandardEquipmentCategoryGroup;

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
}
