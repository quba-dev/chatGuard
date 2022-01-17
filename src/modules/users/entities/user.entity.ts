import { Role } from '../../authentication/entities/role.entity';
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
  PrimaryGeneratedColumn,
  RelationId,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Project } from '../../projects/entities/project.entity';
import { ChatParticipant } from '../../chat/entities/chat-participant.entity';
import { File } from '../../files/entities/file.entity';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';

@Entity()
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column({ default: 'oneTime' })
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: '' })
  addressOne: string;

  @Column({ default: '' })
  addressTwo: string;

  @Column({ default: '' })
  postalCode: string;

  @Column({ default: '' })
  phoneNumber: string;

  @Column({ default: false })
  isOTP: boolean;

  @ManyToOne(() => File)
  @JoinColumn()
  avatarImage: File;

  @ManyToOne(() => Country)
  country: Country;

  @ManyToOne(() => City)
  city: City;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column({ default: false })
  sendEmails: boolean;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  startDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastSeen: Date;

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

  @ManyToMany(() => Role)
  @JoinTable()
  roles: Role[];

  @RelationId((user: User) => user.projects)
  projectIds: number[];

  @ManyToMany(() => Project, (project) => project.users)
  projects: Project[];

  @ManyToMany(() => WorkOrder, (workOrder) => workOrder.users)
  workOrders: WorkOrder[];

  @OneToMany(() => ChatParticipant, (chatParticipants) => chatParticipants.user)
  public chats!: ChatParticipant[];

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      addressOne: this.addressOne,
      addressTwo: this.addressTwo,
      postalCode: this.postalCode,
      phoneNumber: this.phoneNumber,
      isOTP: this.isOTP,
      avatarImage: this.avatarImage,
      country: this.country,
      city: this.city,
      sendEmails: this.sendEmails,
      startDate: this.startDate,
      roles: this.roles,
      organization: this.organization,
      lastSeen: this.lastSeen,
    };
  }
}
