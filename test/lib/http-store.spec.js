const test = require('tape');
const sinon = require('sinon');
const request = require('request');

const NotFoundError = require('stormer').errors.NotFoundError;
const HttpStore = require('../../lib/http-store');

const model = {
  id: {
    type: 'String',
    primaryKey: true
  },
  foo: {
    type: 'String'
  }
};

test('new HttpStore() should throw an error for', (t) => {
  t.test('missing options', (assert) => {
    assert.plan(1);
    try {
      new HttpStore(request);
    } catch (err) {
      assert.equals(err.message, 'options are required');
    }
  });
});

test('store.get(model, pk) should resolve with an object', (assert) => {
  assert.plan(3);
  const expected = {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33'
  };
  // Setup request stub
  const request = (options, cb) => {
    assert.equals(options.method, 'GET');
    assert.equals(options.url, 'http://endpoint.mock.com/v1/api_items/b9d4621e-4abd-11e7-aa99-92ebcb67fe33');
    cb(null, {body: expected});
  }
  // Setup store
  const store = new HttpStore(request, {baseUrl: 'http://endpoint.mock.com/v1'});
  store.define('api_items', model);
  store.alias('items', 'api_items');
  // Assert correct `get`
  store.get('items', 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33').then(actual => assert.equals(actual, expected)).catch(err => assert.error(err));
  sinon.restore();
});

test('store.get(model, pk) should reject with a NotFoundError', (assert) => {
  assert.plan(4);
  // Setup request stub
  const request = (options, cb) => {
    assert.equals(options.method, 'GET');
    assert.equals(options.url, 'http://endpoint.mock.com/v1/api_items/b9d4621e-4abd-11e7-aa99-92ebcb67fe33');
    cb(new Error('Not found error'), null);
  }
  // Setup store
  const store = new HttpStore(request, {baseUrl: 'http://endpoint.mock.com/v1'});
  store.define('api_items', model);
  store.alias('items', 'api_items');
  // Assert failed `get`
  store.get('items', 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33').catch(err => {
    assert.ok(err instanceof NotFoundError);
    assert.equals(err.message, 'Could not find `api_items` with primary key "b9d4621e-4abd-11e7-aa99-92ebcb67fe33"');
  });
  sinon.restore();
});

test('store.filter(model, query) should resolve with error if request fails', (assert) => {
  assert.plan(3);
  // Setup request stub
  const request = (options, cb) => {
    assert.equals(options.method, 'GET');
    assert.equals(options.url, 'http://endpoint.mock.com/v1/api_items?foo=bar');
    cb(new Error('HTTP error'), null);
  }
  // Setup store
  const store = new HttpStore(request, {baseUrl: 'http://endpoint.mock.com/v1'});
  store.define('api_items', model);
  store.alias('items', 'api_items');
  // Assert failed `get`
  store.filter('items', {
    foo: 'bar',
  }).catch(err => {
    assert.equals(err.message, 'HTTP error');
  });
  sinon.restore();
});

test('store.filter(model, query) should resolve with correct data if results are found', (assert) => {
  assert.plan(3);
  const data = {
    data: ['foo', 'bar']
  }
  // Setup request stub
  const request = (options, cb) => {
    assert.equals(options.method, 'GET');
    assert.equals(options.url, 'http://endpoint.mock.com/v1/api_items?foo=bar');
    cb(null, {
      body: data
    });
  }
  // Setup store
  const store = new HttpStore(request, {baseUrl: 'http://endpoint.mock.com/v1'});
  store.define('api_items', model);
  store.alias('items', 'api_items');
  // Assert failed `get`
  store.filter('items', {
    foo: 'bar',
  }).then(res => {
    assert.deepEquals(res, data);
  })
  sinon.restore();
});

test('store.create(model, data) should reject with error on `create` operation', (assert) => {
  assert.plan(3);
  // Setup request stub
  const request = (options, cb) => {
    assert.equals(options.method, 'POST');
    assert.equals(options.url, 'http://endpoint.mock.com/v1/api_items');
    cb(new Error('Could not create record error'), null);
  }
  // Setup store
  const store = new HttpStore(request, {baseUrl: 'http://endpoint.mock.com/v1'});
  store.define('api_items', model);
  store.alias('items', 'api_items');
  // Assert failed `get`
  store.create('items', {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
    foo: 'bar'
  }).catch(err => {
    assert.equals(err.message, 'Could not create record error');
  });
  sinon.restore();
});

test('store.create(model, data) should resolve with correct data on `create` operation', (assert) => {
  assert.plan(4);
  const data = {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
    foo: 'bar',
  }
  // Setup request stub
  const request = (options, cb) => {
    assert.equals(options.method, 'POST');
    assert.equals(options.url, 'http://endpoint.mock.com/v1/api_items');
    assert.deepEquals(options.formData, data)
    cb(null, {body: options.formData});
  }
  // Setup store
  const store = new HttpStore(request, {baseUrl: 'http://endpoint.mock.com/v1'});
  store.define('api_items', model);
  store.alias('items', 'api_items');
  // Assert failed `get`
  store.create('items', data).then(res => {
    assert.deepEquals(res, data);
  });
  sinon.restore();
});

test('store.update(model, data) should reject with error on `update` operation', (assert) => {
  assert.plan(3);
  // Setup request stub
  const request = (options, cb) => {
    assert.equals(options.method, 'PATCH');
    assert.equals(options.url, 'http://endpoint.mock.com/v1/api_items/b9d4621e-4abd-11e7-aa99-92ebcb67fe33');
    cb(new Error('Could not update record error'), null);
  }
  // Setup store
  const store = new HttpStore(request, {baseUrl: 'http://endpoint.mock.com/v1'});
  store.define('api_items', model);
  store.alias('items', 'api_items');
  // Assert failed `get`
  store.update('items', {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
    foo: 'bar'
  }).catch(err => {
    assert.equals(err.message, 'Could not update record error');
  });
  sinon.restore();
});

test('store.update(model, data) should resolve with correct data on `update` operation', (assert) => {
  assert.plan(4);
  const data = {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
    foo: 'bar'
  }
  // Setup request stub
  const request = (options, cb) => {
    assert.equals(options.method, 'PATCH');
    assert.equals(options.url, 'http://endpoint.mock.com/v1/api_items/b9d4621e-4abd-11e7-aa99-92ebcb67fe33');
    assert.deepEquals(options.formData, data)
    cb(null, { body: options.formData })
  }
  // Setup store
  const store = new HttpStore(request, {baseUrl: 'http://endpoint.mock.com/v1'});
  store.define('api_items', model);
  store.alias('items', 'api_items');
  // Assert failed `get`
  store.update('items', data).then(res => {
    assert.deepEquals(res, data);
  });
  sinon.restore();
});

test('store.delete(model, query) should reject for not implemented', (assert) => {
  assert.plan(1);
  // Mock request
  const request = sinon.mock();
  // Setup store
  const store = new HttpStore(request, {});
  store.define('items', model);
  store.delete('items').catch(err => assert.equals(err.message, 'Store.prototype._delete() is not implemented'));
  sinon.restore();
});

test('store._set(model, obj, \'operation\') should reject for unsupported operation', (assert) => {
  assert.plan(1);
  const store = new HttpStore(request, {});
  store._set({}, {}, 'mock_operation').catch(err => assert.equals(err.message, 'Unsupported operation: "mock_operation"'));
});
