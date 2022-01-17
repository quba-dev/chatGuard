import { BuildingLevel } from '../../buildings/entities/building-level.entity';
import { BuildingRoom } from '../../buildings/entities/building-room.entity';
import { Building } from '../../buildings/entities/building.entity';
import { DailycheckProcedure } from '../../dailycheck-procedures/entities/dailycheck-procedure.entity';
import { MaintenanceProcedure } from '../../maintenance-procedures/entities/maintenance-procedure';
import { Project } from '../../projects/entities/project.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EquipmentCategoryGroup } from './equipment-category-group.entity';
import { EquipmentInput } from './equipment-input.entity';
import { EquipmentModel } from './equipment-model.entity';
import { EquipmentProjectCategory } from './equipment-project-category.entity';
import { Manufacturer } from './manufacturer.entity';
import { File } from '../../files/entities/file.entity';
import { StandardEquipmentCategoryGroup } from '../../standard-procedures/entities/standard-equipment-category-group';
import { StandardEquipmentCategory } from '../../standard-procedures/entities/standard-equipment-category';

@Entity()
export class Equipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ default: true })
  isDeletable: boolean;

  @Column({ default: false })
  isReadonly: boolean;

  @ManyToOne(() => StandardEquipmentCategoryGroup)
  @JoinColumn()
  standardCategoryGroup: StandardEquipmentCategoryGroup;

  @ManyToOne(() => StandardEquipmentCategory)
  @JoinColumn()
  standardCategory: StandardEquipmentCategory;

  @ManyToOne(
    () => EquipmentProjectCategory,
    (projectCategory) => projectCategory.equipment,
  )
  @JoinColumn()
  projectCategory: EquipmentProjectCategory;

  @ManyToOne(() => EquipmentCategoryGroup)
  @JoinColumn()
  categoryGroup: EquipmentCategoryGroup;

  @ManyToOne(() => EquipmentModel)
  @JoinColumn()
  equipmentModel: EquipmentModel;

  @ManyToOne(() => Manufacturer)
  @JoinColumn()
  manufacturer: Manufacturer;

  @ManyToOne(() => Project, (project) => project.equipments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  project: Project;

  @ManyToOne(() => Building)
  @JoinColumn()
  building: Building;

  @ManyToOne(() => BuildingLevel)
  @JoinColumn()
  buildingLevel: BuildingLevel;

  @ManyToOne(() => BuildingRoom)
  @JoinColumn()
  buildingRoom: BuildingRoom;

  @OneToMany(() => EquipmentInput, (equipmentInput) => equipmentInput.equipment)
  equipmentInputs: EquipmentInput[];

  @OneToMany(
    () => MaintenanceProcedure,
    (maintenanceProcedure) => maintenanceProcedure.equipment,
  )
  maintenanceProcedures: MaintenanceProcedure[];

  @OneToMany(
    () => DailycheckProcedure,
    (dailycheckProcedure) => dailycheckProcedure.equipment,
  )
  dailycheckProcedures: DailycheckProcedure[];

  @ManyToMany(() => File)
  @JoinTable()
  documentationFiles: File[];

  @ManyToMany(() => File)
  @JoinTable()
  mediaFiles: File[];

  @ManyToMany(() => Equipment)
  @JoinTable()
  linkedEquipments: Equipment[];

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

  maintenanceProceduresCount: number;

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      quantity: this.quantity,
      projectCategory: this.projectCategory,
      categoryGroup: this.categoryGroup,
      equipmentModel: this.equipmentModel,
      standardCategoryGroup: this.standardCategoryGroup,
      standardCategory: this.standardCategory,
      manufacturer: this.manufacturer,
      project: this.project,
      building: this.building,
      buildingLevel: this.buildingLevel,
      buildingRoom: this.buildingRoom,
      equipmentInputs: this.equipmentInputs,
      maintenanceProcedures: this.maintenanceProcedures,
      linkedEquipments: this.linkedEquipments,
      mediaFiles: this.mediaFiles,
      documentationFiles: this.documentationFiles,
      isDeletable: this.isDeletable,
      isReadonly: this.isReadonly,
      maintenanceProceduresCount: this.maintenanceProceduresCount,
    };
  }
}
