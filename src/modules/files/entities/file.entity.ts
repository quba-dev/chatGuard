import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class File {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ default: '' })
  originalName: string;

  @Column({ default: '' })
  mimeType: string;

  @Column({ default: '' })
  fileName: string;

  @Column({ default: 0 })
  size: number;

  @Column({ default: 0 })
  userId: number;

  @Column({ default: 0 })
  organizationId: number;

  toJSON() {
    return {
      uuid: this.uuid,
      originalName: this.originalName,
      fileName: this.fileName,
    };
  }
}
