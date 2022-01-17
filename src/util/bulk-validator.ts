// fct(new CreateBuildingDto(), object.data)

import { validate } from 'class-validator';

export const validateBulk = async (classInstance: any, operationData: any) => {
  const aux = Object.assign(classInstance, operationData);
  const err = await validate(aux);

  if (err && err.length > 0) {
    const beautifiedErrorArray: any[] = [];

    for (const requestError of err) {
      const beautifiedErrorObject = {
        statusCode: 400,
        message: [],
        error: 'Bad request',
      };
      for (const key of Object.keys(requestError.constraints)) {
        beautifiedErrorObject.message.push(requestError.constraints[key]);
      }

      beautifiedErrorArray.push(beautifiedErrorObject);
    }

    return beautifiedErrorArray;
  } else {
    return null;
  }
};
