import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class City {
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
  subdivisionOneIsoCode: string;

  @Column()
  subdivisionOneIsoName: string;

  @Column()
  subdivisionTwoIsoCode: string;

  @Column()
  subdivisionTwoIsoName: string;

  @Column()
  cityName: string;

  @Column()
  metroCode: string;

  @Column()
  timeZone: string;

  @Column()
  isInEuropeanUnion: string;

  @Column({ nullable: true })
  lat: string;

  @Column({ nullable: true })
  lon: string;

  toJSON() {
    return {
      id: this.id,
      name: this.cityName,
      stateName: this.subdivisionOneIsoName,
      stateIsoCode: this.subdivisionOneIsoCode,
    };
  }
}
