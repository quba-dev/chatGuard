import { Unit } from '../../units/entities/unit';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Equipment } from './equipment.entity';

@Entity()
export class EquipmentInput {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  value: string;

  @ManyToOne(() => Unit)
  @JoinColumn()
  unit: Unit;

  @ManyToOne(() => Equipment, (equipment) => equipment.equipmentInputs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  equipment: Equipment;

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
      unit: this.unit,
      value: this.value,
    };
  }
}
