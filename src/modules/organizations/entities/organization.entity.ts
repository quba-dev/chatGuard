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
import { OrganizationTypes } from '../enums/organization-types.enum';
import { Subcontractor } from '../../subcontractors/entities/subcontractor.entity';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { TenantLocation } from '../../buildings/entities/tenant-location.entity';

@Entity()
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  websiteUrl: string;

  @Column({
    type: 'enum',
    enum: OrganizationTypes,
    default: OrganizationTypes.tenant,
  })
  type: OrganizationTypes;

  @Column({ default: '' })
  addressOne: string;

  @Column({ default: '' })
  addressTwo: string;

  @Column({ default: '' })
  postalCode: string;

  @ManyToOne(() => Country)
  country: Country;

  @ManyToMany(() => Country)
  @JoinTable()
  defaultCountries: Country[];

  @ManyToOne(() => City)
  city: City;

  @OneToOne(() => User)
  @JoinColumn()
  manager: User;

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
  @JoinColumn()
  parentOrganization: Organization;

  @OneToMany(() => Subcontractor, (subcontractor) => subcontractor.organization)
  subcontractors: Subcontractor[];

  @OneToMany(() => Project, (project) => project.providerOrganization)
  projects: Project[];

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(
    () => TenantLocation,
    (tenantLocation) => tenantLocation.organization,
  )
  locations: TenantLocation[];

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      websiteUrl: this.websiteUrl,
      type: this.type,
      addressOne: this.addressOne,
      addressTwo: this.addressTwo,
      postalCode: this.postalCode,
      country: this.country,
      city: this.city,
      manager: this.manager,
      subcontractors: this.subcontractors,
      projects: this.projects,
      parentOrganization: this.parentOrganization,
      users: this.users,
      locations: this.locations,
    };
  }
}
