import { City } from '../../geoLocation/entities/city.entity';
import { Country } from '../../geoLocation/entities/country.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { SubcontractorContact } from './subcontractor-contact.entity';
import { SubcontractorCategory } from './subcontractor-category.entity';
import { MaintenanceProcedure } from '../../maintenance-procedures/entities/maintenance-procedure';

@Entity()
export class Subcontractor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  companyName: string;

  @Column({ default: '' })
  description: string;

  @Column({ default: '' })
  websiteUrl: string;

  @Column({ default: '' })
  addressOne: string;

  @Column({ default: '' })
  addressTwo: string;

  @Column({ default: '' })
  postalCode: string;

  @ManyToOne(() => Country)
  country: Country;

  @ManyToOne(() => City)
  city: City;

  @OneToMany(
    () => MaintenanceProcedure,
    (maintenanceProcedure) => maintenanceProcedure.subcontractor,
  )
  maintenanceProcedures: MaintenanceProcedure[];

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

  @ManyToOne(() => Organization)
  organization: Organization;

  @ManyToMany(
    () => SubcontractorCategory,
    (subcontractorCategory) => subcontractorCategory.subcontractors,
  )
  @JoinTable()
  subcontractorCategories: SubcontractorCategory[];

  @OneToMany(() => SubcontractorContact, (contact) => contact.subcontractor)
  contacts: SubcontractorContact[];

  toJSON() {
    return {
      id: this.id,
      companyName: this.companyName,
      description: this.description,
      websiteUrl: this.websiteUrl,
      addressOne: this.addressOne,
      addressTwo: this.addressTwo,
      postalCode: this.postalCode,
      country: this.country,
      city: this.city,
      maintenanceProcedures: this.maintenanceProcedures,
      organization: this.organization,
      subcontractorCategories: this.subcontractorCategories,
      contacts: this.contacts,
    };
  }
}
