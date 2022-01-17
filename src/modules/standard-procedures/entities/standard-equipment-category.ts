import { Organization } from '../../organizations/entities/organization.entity';
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

@Entity()
export class StandardEquipmentCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  uuid: string;

  @ManyToOne(() => Organization)
  @JoinColumn()
  organization: Organization;

  @OneToMany(
    () => StandardEquipmentCategoryGroup,
    (categoryGroup) => categoryGroup.category,
  )
  categoryGroups: StandardEquipmentCategoryGroup[];

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
