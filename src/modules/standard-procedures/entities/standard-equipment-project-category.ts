import { Organization } from '../../organizations/entities/organization.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class StandardEquipmentProjectCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  uuid: string;

  @ManyToOne(() => Organization)
  @JoinColumn()
  organization: Organization;

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
