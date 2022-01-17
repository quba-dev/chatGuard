import { Equipment } from '../../equipments/entities/equipment.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MaintenanceOperation } from './maintenance-operation';
import { Subcontractor } from '../../subcontractors/entities/subcontractor.entity';

@Entity()
export class MaintenanceProcedure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  type: string;

  @Column({ default: '', nullable: true })
  subType: string;

  @Column({ default: '' })
  frequency: string;

  @Column({ default: false })
  isFromStandard: boolean;

  @OneToMany(() => MaintenanceOperation, (operation) => operation.procedure)
  operations: MaintenanceOperation[];

  @ManyToOne(() => Equipment, (equipment) => equipment.maintenanceProcedures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  equipment: Equipment;
  @Column()
  equipmentId: number;

  @Column({ nullable: true })
  subcontractorId: number;

  @ManyToOne(
    () => Subcontractor,
    (subcontractor) => subcontractor.maintenanceProcedures,
  )
  @JoinColumn()
  subcontractor: Subcontractor;

  @Column({ nullable: true, type: 'timestamptz' })
  startDate: Date;

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

  @DeleteDateColumn({
    type: 'timestamptz',
  })
  deletedAt: Date;

  toJSON() {
    return {
      id: this.id,
      isFromStandard: this.isFromStandard,
      type: this.type,
      subType: this.subType,
      frequency: this.frequency,
      operations: this.operations,
      subcontractor: this.subcontractor,
      equipment: this.equipment,
      startDate: this.startDate,
    };
  }
}
