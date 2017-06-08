# stormer-http
Implementation of  [Stormer Store](https://github.com/avocarrot/stormer) for HTTP clients

[![CircleCI](https://circleci.com/gh/Avocarrot/stormer-http/tree/master.svg?style=shield&circle-token=746c5c023e9387801481462f8e7316ad0c0a5e8c)](https://circleci.com/gh/Avocarrot/stormer-http/tree/master)


## Requirements

- [stormer ^v0.9.0 ](https://www.npmjs.com/package/stormer)
- [request ^v2.81.0 ](https://www.npmjs.com/package/request)


## Available stores

- [Http Store](https://github.com/Avocarrot/stormer/blob/master/README.md#http)
- [Http HAL Store](https://github.com/Avocarrot/stormer/blob/master/README.md#http-hal)


#### <a name="http"></a> Http Store

```js
const HttpStore = require('stormer-http').HttpStore;
const store = new HttpStore({
  timeout: 1000,
  baseUrl: 'http://endpoint.mock.com/v1',
});
```

#### <a name="http-hal"></a> Http HAL Store
See http://stateless.co/hal_specification.html

```js
const HttpHalStore = require('stormer-http').HttpHalStore;
const store = new HttpHalStore({
  timeout: 1000,
  baseUrl: 'http://endpoint.mock.com/v1',
});
```

## Contributing

This project is work in progress and we'd love more people contributing to it.

1. Fork the repo
2. Apply your changes
3. Write tests
4. Submit your pull request
