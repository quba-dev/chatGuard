import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class WeatherDaily {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cityId: number;

  @Column()
  cityName: string;

  @Column({ nullable: true })
  dt: number;

  @Column({ nullable: true })
  sunrise: number;

  @Column({ nullable: true })
  sunset: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  tempDay: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  tempMin: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  tempMax: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  tempNight: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  tempEve: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  tempMorn: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  feelsLikeDay: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  feelsLikeNight: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  feelsLikeEve: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  feelsLikeMorn: number;

  @Column({ nullable: true })
  pressure: number;

  @Column({ nullable: true })
  humidity: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  uvi: number;

  @Column({ nullable: true })
  clouds: number;

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
