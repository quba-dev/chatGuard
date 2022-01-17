import { BadRequestException, Injectable } from '@nestjs/common';
import { parseFile } from '@fast-csv/parse';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorTypes } from '../error/enums/errorTypes.enum';
import { User } from '../users/entities/user.entity';
import { OrganizationTypes } from '../organizations/enums/organization-types.enum';

@Injectable()
export class GeoLocationService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(City)
    private citiesRepository: Repository<City>,
    @InjectRepository(Country)
    private countriesRepository: Repository<Country>,
  ) {}

  // switch in functie de provider // beneficiary (ale lui) // tenant
  async getCountries(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: [
        'organization',
        'organization.defaultCountries',
        'organization.parentOrganization',
        'organization.parentOrganization.defaultCountries',
      ],
    });

    switch (true) {
      case user.organization.type === OrganizationTypes.provider:
        return user.organization.defaultCountries;
      case user.organization.type === OrganizationTypes.tenant:
        return user.organization.parentOrganization.defaultCountries;
      case user.organization.type === OrganizationTypes.beneficiary:
        return user.organization.parentOrganization.defaultCountries;
    }

    return user.organization.parentOrganization.defaultCountries;
  }

  async getStatesByCountryId(countryId: number) {
    const country = await this.countriesRepository.findOne(countryId);
    if (!country) throw new BadRequestException(ErrorTypes.COUNTRY_NOT_FOUND);

    const states = await this.citiesRepository.find({
      select: ['subdivisionOneIsoCode', 'subdivisionOneIsoName'],
      where: { countryIsoCode: country.countryIsoCode },
      order: { subdivisionOneIsoName: 'ASC' },
    });

    // converting the elements to JSON and use those as keys for a Map
    // and then convert that back to an array to eliminate
    return [...new Map(states.map((o) => [JSON.stringify(o), o])).values()];
  }

  async getCitiesByCountryIdAndState(countryId: number, stateIsoCode: string) {
    const country = await this.countriesRepository.findOne(countryId);
    if (!country) throw new BadRequestException(ErrorTypes.COUNTRY_NOT_FOUND);
    return await this.citiesRepository.find({
      select: ['id', 'cityName'],
      where: {
        countryIsoCode: country.countryIsoCode,
        subdivisionOneIsoCode: stateIsoCode,
      },
      order: { cityName: 'ASC' },
    });
  }

  async importCountries() {
    const countriesCount = await this.countriesRepository.count();
    if (countriesCount >= 252) {
      console.log('Countries already inserted in db');
      return;
    }

    const countries = [];
    const parseCountryCsvPromise = () =>
      new Promise((resolve) => {
        parseFile(
          'src/modules/geoLocation/data/GeoLite2-Country-Locations-en.csv',
          { headers: true },
        )
          .on('error', (error) => console.error(error))
          .on('data', (row) => {
            const country = new Country();
            country.localeCode = row['locale_code'];
            country.continentCode = row['continent_code'];
            country.continentName = row['continent_name'];
            country.countryIsoCode = row['country_iso_code'];
            country.countryName = row['country_name'];
            country.isInEuropeanUnion = row['is_in_european_union'];
            countries.push(country);
          })
          .on('end', (rowCount: number) => {
            console.log(`Parsed ${rowCount} rows`);
            resolve(true);
          });
      });

    await parseCountryCsvPromise();
    await this.countriesRepository.save(countries);
  }

  async importCities() {
    const citiesCount = await this.citiesRepository.count();
    if (citiesCount >= 121259) {
      console.log('Cities already inserted in db');
      return;
    }

    const cities = [];
    const parseCityCsvPromise = () =>
      new Promise((resolve) => {
        parseFile(
          'src/modules/geoLocation/data/GeoLite2-City-Locations-en.csv',
          { headers: true },
        )
          .on('error', (error) => console.error(error))
          .on('data', (row) => {
            const city = new City();
            city.localeCode = row['locale_code'];
            city.continentCode = row['continent_code'];
            city.continentName = row['continent_name'];
            city.countryIsoCode = row['country_iso_code'];
            city.countryName = row['country_name'];
            city.subdivisionOneIsoCode = row['subdivision_1_iso_code'];
            city.subdivisionOneIsoName = row['subdivision_1_name'];
            city.subdivisionTwoIsoCode = row['subdivision_2_iso_code'];
            city.subdivisionTwoIsoName = row['subdivision_2_name'];
            city.cityName = row['city_name'];
            city.metroCode = row['metro_code'];
            city.timeZone = row['time_zone'];
            city.isInEuropeanUnion = row['is_in_european_union'];
            cities.push(city);
          })
          .on('end', (rowCount: number) => {
            console.log(`Parsed ${rowCount} rows`);
            resolve(true);
          });
      });

    await parseCityCsvPromise();
    const step = 1000;
    let start = 0;
    while (start < cities.length) {
      await this.citiesRepository.save(cities.slice(start, start + step));
      start = start + step;
    }
  }
}
