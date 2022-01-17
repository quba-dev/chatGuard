export const buildOrderObject = (
  orderRules = '',
  allowedFields: string[] = [],
  defaultValue: any,
) => {
  if (!orderRules) return defaultValue;

  const orderItems = orderRules.split(',');
  const result = {};
  for (const item of orderItems) {
    const components = item.split(':');
    if (
      components.length == 2 &&
      allowedFields.indexOf(components[0]) > -1 &&
      (components[1].toLowerCase() == 'asc' ||
        components[1].toLowerCase() == 'desc')
    ) {
      result[components[0]] = components[1].toUpperCase();
    }
  }
  return result;
};
