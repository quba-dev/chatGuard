import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Project } from './project.entity';

@Entity()
export class Device {
  @PrimaryGeneratedColumn('uuid')
  uuid: number;

  @Column()
  deviceId: string;

  @ManyToOne(() => Project)
  @JoinColumn()
  project: Project;
}
