const tape = require('tape');
const nock = require('nock');
const tapeNock = require('tape-nock')

const stormer = require('stormer');
const NotFoundError = stormer.errors.NotFoundError;
const AlreadyExistsError = stormer.errors.AlreadyExistsError;
const HttpResponseError = require('../../lib/errors/HttpResponseError');
const HttpStore = require('../../lib/http-store');

const test = tapeNock(tape, { //options object to be passed to nock, not required
  defaultTestOptions: { // optionally provide default options to nockBack for each test
    before: function() {},
    after: function() {
      nock.restore();
    }
  }
});

/**
 * Mock model
 *
 * @property {Object} model
 *
 */
const model = {
  id: {
    type: 'String',
    primaryKey: true
  },
  foo: {
    type: 'String'
  },
  schema: {
    primaryKey: 'id',
    type: 'String'
  }
};

/**
 * Returns an HttpStore instance
 *
 * @function generateStore
 * @param {Object} params
 * @return {HttpStore}
 *
 */
const generateStore = (alias, baseUrl) => {
  const store = new HttpStore({baseUrl});
  store.define('api_items', model);
  store.alias(alias, 'api_items');
  return store;
}

/**
 * Tests: HttpStore.constructor()
 */

test('new HttpStore() should', (t) => {
  t.test('be instance of Store', (assert) => {
    assert.plan(1);
    const store = new HttpStore({baseUrl: 'http://endpoint.mock.com/v1'});
    assert.ok(store instanceof  stormer.Store);
  });
  t.test('throw an error for missing options', (assert) => {
    assert.plan(1);
    try {
      new HttpStore();
    } catch (err) {
      assert.equals(err.message, 'options are required');
    }
  });
});

/**
 * Tests: HttpStore._requestPromise(options)
 */

test('store._requestPromise(options) should reject with error on network failure', (assert) => {
  assert.plan(1);
  // Setup request stub
  nock('http://endpoint.mock.com/v1').get('/api_items/b9d4621e-4abd-11e7-aa99-92ebcb67fe33').reply(500);
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert rejection
  store._requestPromise({method: 'GET', url: '/items/b9d4621e-4abd-11e7-aa99-92ebcb67fe33'}).catch((err) => {
    assert.ok(err.message);
  });
});

/**
 * Tests: HttpStore.get(model, pk)
 */

test('store.get(model, pk) should resolve with an object', (assert) => {
  assert.plan(1);
  // Setup request stub
  nock('http://endpoint.mock.com/v1').get('/api_items/b9d4621e-4abd-11e7-aa99-92ebcb67fe33').reply(200, {id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33'});
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `get`
  store.get('items', 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33').then((actual) => {
    assert.deepEquals(actual, {id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33'});
  });
});

test('store.get(model, pk) should reject with a NotFoundError if model is not found', (assert) => {
  assert.plan(2);
  // Setup request stub
  nock('http://endpoint.mock.com/v1').get('/api_items/b9d4621e-4abd-11e7-aa99-92ebcb67fe33').reply(404, {})
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `get`
  store.get('items', 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33').catch((err) => {
    assert.ok(err instanceof NotFoundError);
    assert.equals(err.message, 'Could not find "api_items" with primary key "b9d4621e-4abd-11e7-aa99-92ebcb67fe33"');
  });
});

/**
 * Tests: HttpStore.filter(model, query)
 */

test('store.filter(model, query) should resolve with error on failure', (assert) => {
  assert.plan(2);
  // Setup request stub
  nock('http://endpoint.mock.com/v1').get('/api_items?name=Foo').reply(400, { message: 'Invalid filter response'})
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `filter`
  store.filter('items', {name: 'Foo'}).catch((err) => {
    assert.ok(err instanceof HttpResponseError);
    assert.equals(err.body.message, 'Invalid filter response');
  });
});

test('store.filter(model, query) should resolve with correct data if results are found', (assert) => {
  assert.plan(1);
  // Setup request stub
  const data = [
    {
      id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
      name: 'Foo'
    }
  ];
  nock('http://endpoint.mock.com/v1').get('/api_items?name=Foo').reply(200, {data: data})
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `filter`
  store.filter('items', {name: 'Foo'}).then((res) => {
    assert.deepEquals(res, {data: data});
  });
});

/**
 * Tests: HttpStore.delete(model, pk)
 */

test('store.delete(model, query) should resolve with success code', (assert) => {
  assert.plan(1);
  // Setup request stub
  nock('http://endpoint.mock.com/v1').delete('/api_items/b9d4621e-4abd-11e7-aa99-92ebcb67fe33').reply(204)
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `delete`
  store.delete('items', {id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33'}).then((res) => {
    assert.ok(res);
  });
});

test('store.delete(model, query) should reject with error on failure', (assert) => {
  assert.plan(2);
  // Setup request stub
  nock('http://endpoint.mock.com/v1').delete('/api_items/b9d4621e-4abd-11e7-aa99-92ebcb67fe33').reply(400, { message: 'Could not delete'})
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `delete`
  store.delete('items', {id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33'}).catch((err) => {
    assert.ok(err instanceof HttpResponseError);
    assert.equals(err.body.message, 'Could not delete');
  });
});

/**
 * Tests: HttpStore.create(model, data)
 */

test('store.create(model, data) should reject with error on `create` operation failure and propagate reported error', (assert) => {
  assert.plan(2);
  const data = {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
    name: 'Foo'
  };
  // Setup request stub
  nock('http://endpoint.mock.com/v1').post('/api_items').reply(400, { 'message': 'There was a problem' });
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `create`
  store.create('items', data).catch((err) => {
    assert.ok(err instanceof HttpResponseError);
    assert.equals(err.body.message, 'There was a problem');
  });
});

test('store.create(model, data) should reject with `AlreadyExistsError` error on `create` operation if model already exists', (assert) => {
  assert.plan(2);
  const data = {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
    'name': 'Foo'
  };
  // Setup request stub
  nock('http://endpoint.mock.com/v1').post('/api_items').reply(409);
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `create`
  store.create('items', data).catch((err) => {
    assert.ok(err instanceof AlreadyExistsError);
    assert.equals(err.message, 'Model for "b9d4621e-4abd-11e7-aa99-92ebcb67fe33" already exists');
  });
});

test('store.create(model, data) should resolve with correct data on `create` operation', (assert) => {
  assert.plan(1);
  const data = {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
    name: 'Foo'
  };
  // Setup request stub
  nock('http://endpoint.mock.com/v1').post('/api_items').reply(201, data);
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `create`
  store.create('items', data).then((res) => {
    assert.deepEquals(res, data);
  });
});

/**
 * Tests: HttpStore.update(model, data)
 */

test('store.update(model, data) should reject with error on `update` operation failure', (assert) => {
  assert.plan(2);
  const data = {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
    name: 'Foo'
  };
  // Setup request stub
  nock('http://endpoint.mock.com/v1').put('/api_items/b9d4621e-4abd-11e7-aa99-92ebcb67fe33').reply(400, { message: 'There was a problem' });
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `update`
  store.update('items', data).catch((err) => {
    assert.ok(err instanceof HttpResponseError);
    assert.equals(err.body.message, 'There was a problem');
  });
});

test('store.update(model, data) should resolve with correct data on `update` operation', (assert) => {
  assert.plan(1);
  const data = {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
    name: 'Foo'
  };
  // Setup request stub
  nock('http://endpoint.mock.com/v1').put('/api_items/b9d4621e-4abd-11e7-aa99-92ebcb67fe33').reply(200, data);
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `update`
  store.update('items', data).then((actual) => {
    assert.deepEquals(actual, data);
  });
});

/**
 * Tests: HttpStore._set(model, data, operation)
 */

test('store._set(model, data, \'operation\') should reject for unsupported operation', (assert) => {
  assert.plan(1);
  const store = new HttpStore({baseUrl: 'http://endpoint.mock.com/v1'});
  // Assert correct `_set`
  store._set(model, {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33'
  }, 'mock_operation').catch(err => assert.equals(err.message, 'Unsupported operation: "mock_operation"'));
});
