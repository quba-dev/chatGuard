import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class WeatherHourly {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cityId: number;

  @Column()
  cityName: string;

  @Column({ nullable: true })
  dt: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  temp: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  feels_like: number;

  @Column({ nullable: true })
  pressure: number;

  @Column({ nullable: true })
  humidity: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  uvi: number;

  @Column({ nullable: true })
  clouds: number;

  @Column({ nullable: true })
  visibility: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  wind_speed: number;

  @Column({ nullable: true })
  wind_deg: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  wind_gust: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  pop: number;

  //Weather
  @Column({ nullable: true })
  generalWeather: string;

  @Column({ nullable: true })
  generalWeatherDescription: string;

  @Column({ nullable: true })
  generalWeatherIcon: string;
}
