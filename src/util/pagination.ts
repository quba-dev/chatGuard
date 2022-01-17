export const buildPaginationObject = (page = 0, limit = 0) => {
  if (limit == 0) return {};

  const computedPage = (page - 1) * limit;
  return {
    take: limit,
    skip: computedPage < 0 ? 0 : computedPage,
  };
};
