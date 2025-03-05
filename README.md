# sta-react
React hooks to work with swagger-typescript-api

```
const { getRoles, getUser, createUser, updateUser, fetchUsers } = useAPI();

const { isLoading, data, list, error, statusCode, request } = useRequest(() => fetchUsers(query), [query]);
const { ... } = useRequest(id ? () => getUser(id) : undefined, [id]);
const { ... } = useRequest(getRoles);

const { isPending, mutate } = useMutate(createUser);
const { ... } = useMutate((body) => updateUser(id, body));

request();
mutate({...});

```
