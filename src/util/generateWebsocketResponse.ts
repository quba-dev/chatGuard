export const createWebsocketError = (event: string, error: string) => {
  return {
    event,
    data: {
      error,
    },
  };
};

export const createWebsocketResponse = (event: string, data: any) => {
  return {
    event,
    data,
  };
};
