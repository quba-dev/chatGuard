import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  localeCode: string;

  @Column()
  continentCode: string;

  @Column()
  continentName: string;

  @Column()
  countryIsoCode: string;

  @Column()
  countryName: string;

  @Column()
  isInEuropeanUnion: string;

  toJSON() {
    return {
      id: this.id,
      name: this.countryName,
    };
  }
}
