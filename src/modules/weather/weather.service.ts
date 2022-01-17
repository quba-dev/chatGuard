import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';
import { AppConfig } from '../configuration/configuration.service';
import { City } from '../geoLocation/entities/city.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectStatus } from '../projects/enums/project-status.enum';
import { WeatherCurrent } from './entities/weather-current.entity';
import { WeatherDaily } from './entities/weather-daily.entity';
import { WeatherHourly } from './entities/weather-hourly.entity';
@Injectable()
export class WeatherService {
  constructor(
    private httpService: HttpService,
    private config: AppConfig,
    @InjectRepository(City)
    private citiesRepository: Repository<City>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(WeatherCurrent)
    private currentWeatherRepository: Repository<WeatherCurrent>,
    @InjectRepository(WeatherHourly)
    private hourlyWeatherRepository: Repository<WeatherHourly>,
    @InjectRepository(WeatherDaily)
    private dailyWeatherRepository: Repository<WeatherDaily>,
  ) {}

  async findOne(cityId: number) {
    const weatherDaily = await this.dailyWeatherRepository.find({
      where: { cityId },
    });

    const weatherHourly = await this.hourlyWeatherRepository.find({
      where: { cityId },
    });

    if (weatherDaily.length > 0) {
      return { weatherDaily, weatherHourly };
    } else {
      return this.updateWeatherFromApi(cityId);
    }
  }

  async updateWeatherForActiveCities() {
    const activeProjects = await this.projectRepository.find({
      where: { status: ProjectStatus.active },
    });

    for (const activeProject of activeProjects) {
      if (activeProject.cityId) {
        await this.updateWeatherFromApi(activeProject.cityId);
      }
    }

    return true;
  }

  async updateWeatherFromApi(cityId) {
    const WEATHER_APPID = this.config.values.database.weather;

    const city = await this.citiesRepository.findOne(cityId);
    if (!city.lat) {
      const latLon =
        'https://api.openweathermap.org/geo/1.0/direct?q=' +
        city.cityName +
        ',Ro&appid=' +
        WEATHER_APPID;

      const latLonResponse = await lastValueFrom(this.httpService.get(latLon));
      city.lat = latLonResponse.data[0].lat;
      city.lon = latLonResponse.data[0].lon;

      await this.citiesRepository.save(city);
    }

    const weatherUrl =
      'https://api.openweathermap.org/data/2.5/onecall?lat=' +
      city.lat +
      '&lon=' +
      city.lon +
      '&appid=' +
      WEATHER_APPID +
      '&units=metric&exclude=minutely,alerts';
    const weatherResponse = await lastValueFrom(
      this.httpService.get(weatherUrl),
    );

    // save CURRENT weather in db
    const currentWeatherData: DeepPartial<WeatherCurrent> = {
      ...weatherResponse.data.current,
    };

    currentWeatherData.cityId = city.id;
    currentWeatherData.cityName = city.cityName;
    currentWeatherData.generalWeather =
      weatherResponse.data.current.weather[0].main;
    currentWeatherData.generalWeatherDescription =
      weatherResponse.data.current.weather[0].description;
    currentWeatherData.generalWeatherIcon =
      weatherResponse.data.current.weather[0].icon;

    const currentWeather =
      this.currentWeatherRepository.create(currentWeatherData);
    await this.currentWeatherRepository.save(currentWeather);

    // Hourly
    const res = { weatherHourly: [], weatherDaily: [] };

    this.hourlyWeatherRepository.delete({ cityId });
    for (const hourlyWeatherDataItem of weatherResponse.data.hourly) {
      const hourlyWeatherData: DeepPartial<WeatherHourly> = {
        ...hourlyWeatherDataItem,
      };

      hourlyWeatherData.cityId = city.id;
      hourlyWeatherData.cityName = city.cityName;
      hourlyWeatherData.generalWeather =
        weatherResponse.data.current.weather[0].main;
      hourlyWeatherData.generalWeatherDescription =
        weatherResponse.data.current.weather[0].description;
      hourlyWeatherData.generalWeatherIcon =
        weatherResponse.data.current.weather[0].icon;

      const hourlyWeather =
        this.hourlyWeatherRepository.create(hourlyWeatherData);
      await this.hourlyWeatherRepository.save(hourlyWeather);

      res.weatherHourly.push(hourlyWeather); // la vel si pt daily
    }

    // Daily
    this.dailyWeatherRepository.delete({ cityId });
    for (const dailyWeatherDataItem of weatherResponse.data.daily) {
      const dailyWeatherData: DeepPartial<WeatherDaily> = {
        ...dailyWeatherDataItem,
      };

      dailyWeatherData.cityId = city.id;
      dailyWeatherData.cityName = city.cityName;
      dailyWeatherData.tempDay = dailyWeatherDataItem.temp.day;
      dailyWeatherData.tempMin = dailyWeatherDataItem.temp.min;
      dailyWeatherData.tempMax = dailyWeatherDataItem.temp.max;
      dailyWeatherData.tempNight = dailyWeatherDataItem.temp.night;
      dailyWeatherData.tempEve = dailyWeatherDataItem.temp.eve;
      dailyWeatherData.tempMorn = dailyWeatherDataItem.temp.morn;

      dailyWeatherData.feelsLikeDay = dailyWeatherDataItem.feels_like.day;
      dailyWeatherData.feelsLikeNight = dailyWeatherDataItem.feels_like.night;
      dailyWeatherData.feelsLikeEve = dailyWeatherDataItem.feels_like.eve;
      dailyWeatherData.feelsLikeMorn = dailyWeatherDataItem.feels_like.morn;

      dailyWeatherData.generalWeather = dailyWeatherDataItem.weather[0].main;
      dailyWeatherData.generalWeatherDescription =
        dailyWeatherDataItem.weather[0].description;
      dailyWeatherData.generalWeatherIcon =
        dailyWeatherDataItem.weather[0].icon;

      const dailyWeather = this.dailyWeatherRepository.create(dailyWeatherData);
      await this.dailyWeatherRepository.save(dailyWeather);

      res.weatherDaily.push(dailyWeather);
    }

    return res;
  }
}
