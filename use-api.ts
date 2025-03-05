export const useAPI = () => {
  const { baseUrl, getAccessToken } = useContext(MyContext);

  const instance = new Api({
    baseUrl,
    baseApiParams: {},
    customFetch: (...fetchParams: Parameters<typeof fetch>) => {
      const [input, init = {}] = fetchParams;

      const config = {
        ...init,
        headers: {
          ...init.headers,
          Authorization: `Bearer ${getAccessToken()}`,
        },
      };

      return fetch(input, config);
    },
  });

  return instance.api;
};
