import { City } from '../../geoLocation/entities/city.entity';
import { Country } from '../../geoLocation/entities/country.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Building } from '../../buildings/entities/building.entity';
import { Equipment } from '../../equipments/entities/equipment.entity';
import { DailycheckProcedure } from '../../dailycheck-procedures/entities/dailycheck-procedure.entity';
import { ProjectStatus } from '../enums/project-status.enum';
import { File } from '../../files/entities/file.entity';
import { Chat } from 'src/modules/chat/entities/chat.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  summary: string;

  @OneToOne(() => File)
  @JoinColumn()
  primaryImage: File;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.draft,
  })
  status: ProjectStatus;

  @ManyToOne(() => Country)
  country: Country;

  @Column({ nullable: true })
  cityId: number;

  @ManyToOne(() => City)
  city: City;

  @Column({ default: '' })
  addressOne: string;

  @Column({ default: '' })
  addressTwo: string;

  @Column({ default: '' })
  postalCode: string;

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

  @Column({
    default: () => 'NOW()',
    onUpdate: 'NOW()',
    type: 'timestamptz',
  })
  globalUpdatedAt: Date;

  @ManyToMany(() => File)
  @JoinTable()
  mediaGalleryFiles: File[];

  //general contractor
  @Column({ default: '' })
  generalContractorName: string;

  @ManyToOne(() => Country)
  generalContractorCountry: Country;

  @ManyToOne(() => City)
  generalContractorCity: City;

  @Column({ default: '' })
  generalContractorAddressOne: string;

  @Column({ default: '' })
  generalContractorAddressTwo: string;

  @Column({ default: '' })
  generalContractorPostalCode: string;

  @ManyToMany(() => File)
  @JoinTable()
  generalContractorWarrantyFiles: File[];

  //general contractor contact
  @Column({ default: '' })
  generalContractorContact: string;

  @Column({ default: '' })
  generalContractorEmail: string;

  @Column({ default: '' })
  generalContractorPhoneNumber: string;

  //channels
  @OneToOne(() => Chat)
  @JoinColumn()
  beneficiaryChannel: Chat;

  @OneToOne(() => Chat)
  @JoinColumn()
  managementChannel: Chat;

  @OneToOne(() => Chat)
  @JoinColumn()
  staffChannel: Chat;

  //relations
  @ManyToMany(() => User, (user) => user.projects)
  @JoinTable()
  users: User[];

  @ManyToOne(() => Organization, (organization) => organization.projects)
  @JoinTable()
  providerOrganization: Organization;

  @OneToMany(() => Building, (building) => building.project)
  buildings: Building[];

  @OneToMany(
    () => DailycheckProcedure,
    (dailycheckProcedure) => dailycheckProcedure.project,
  )
  dailycheckProcedures: DailycheckProcedure[];

  @OneToMany(() => Equipment, (equipment) => equipment.project)
  equipments: Equipment[];
}
