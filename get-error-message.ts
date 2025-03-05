import { get } from 'lodash';

export const getErrorMessage = (error: any, defaultError?: string): string => {
  const validationError = get(error, 'errors[0].displayOptions.text');
  const customError = get(error, 'displayOptions.text');
  const commonError = 'Error'

  return validationError ?? customError ?? defaultError ?? commonError;
};
