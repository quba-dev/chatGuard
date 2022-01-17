import { BadRequestException } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { filter } from 'rxjs';
import { ErrorTypes } from '../modules/error/enums/errorTypes.enum';
import { Between, In } from 'typeorm';

export const buildGetEventFilterObject = (filter = '') => {
  if (!filter) return {};

  const filterRules = [];
  const allowedFields = [
    'buildingId',
    'levelId',
    'roomId',
    'categoryGroupId',
    'projectCategoryId',
    'frequency',
  ];

  const orderItems = filter.split(',');

  for (const item of orderItems) {
    const components = item.split(':');
    if (components.length == 2 && allowedFields.indexOf(components[0]) > -1) {
      filterRules.push({
        key: components[0],
        val: components[1],
      });
    }
  }

  const filterObject: any = {
    procedure: {
      frequency: [],
      equipment: {
        building: [],
        buildingLevel: [],
        buildingRoom: [],
        categoryGroup: [],
        projectCategory: [],
      },
    },
  };

  const procedureEquipmentFilters = [
    { key: 'buildingId', filter: 'building' },
    { key: 'levelId', filter: 'buildingLevel' },
    { key: 'roomId', filter: 'buildingRoom' },
    { key: 'categoryGroupId', filter: 'categoryGroup' },
    { key: 'projectCategoryId', filter: 'projectCategory' },
  ];
  for (const filterItem of filterRules) {
    for (const procedureEquipmentFilterItem of procedureEquipmentFilters) {
      if (procedureEquipmentFilterItem.key == filterItem.key) {
        filterObject.procedure.equipment[
          procedureEquipmentFilterItem.filter
        ].push(filterItem.val);
      }
    }

    if (filterItem.key == 'frequency') {
      filterObject.procedure.frequency.push(filterItem.val);
    }
  }

  for (const procedureEquipmentFilterItem of procedureEquipmentFilters) {
    if (
      filterObject.procedure.equipment[procedureEquipmentFilterItem.filter]
        .length > 0
    ) {
      filterObject.procedure.equipment[procedureEquipmentFilterItem.filter] = {
        id:
          filterObject.procedure.equipment[procedureEquipmentFilterItem.filter]
            .length == 1
            ? filterObject.procedure.equipment[
                procedureEquipmentFilterItem.filter
              ][0]
            : In(
                filterObject.procedure.equipment[
                  procedureEquipmentFilterItem.filter
                ],
              ),
      };
    } else {
      delete filterObject.procedure.equipment[
        procedureEquipmentFilterItem.filter
      ];
    }
  }

  if (filterObject.procedure.frequency.length > 0) {
    filterObject.procedure.frequency =
      filterObject.procedure.frequency.length == 1
        ? filterObject.procedure.frequency[0]
        : In(filterObject.procedure.frequency);
  } else {
    delete filterObject.procedure.frequency;
  }

  return filterObject;
};

export const buildIntervalFilter = (
  intervalStartDate: string,
  intervalEndDate: string,
  intervalName: string,
) => {
  const filterObject = {};
  let filterStartDate: dayjs.Dayjs;
  let filterEndDate: dayjs.Dayjs;
  try {
    if (intervalStartDate && intervalEndDate) {
      filterStartDate = dayjs(intervalStartDate)
        .set('hour', 0)
        .set('minute', 0)
        .set('second', 0);
      filterEndDate = dayjs(intervalEndDate)
        .set('hour', 23)
        .set('minute', 59)
        .set('second', 59);
      if (filterEndDate.isBefore(filterStartDate)) throw new Error();

      filterObject[intervalName] = Between(
        filterStartDate.toDate(),
        filterEndDate.toDate(),
      );
    }

    return [filterObject, filterStartDate, filterEndDate];
  } catch (e) {
    console.log(e);
    throw new BadRequestException(ErrorTypes.INVALID_DATES);
  }
};
