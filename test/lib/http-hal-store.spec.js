const tape = require('tape');
const nock = require('nock');
const tapeNock = require('tape-nock')
const HttpHalStore = require('../../lib/http-hal-store');
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
 * Returns an HttpHalStore instance
 *
 * @function generateStore
 * @param {Object} params
 * @return {HttpHalStore}
 *
 */
const generateStore = (alias, baseUrl) => {
  const store = new HttpHalStore({baseUrl});
  store.define('api_items', model);
  store.alias(alias, 'api_items');
  return store;
}

/**
 * Tests: HttpHalStore.constructor()
 */

test('new HttpHalStore() should', (t) => {
  t.test('be instance of HttpStore', (assert) => {
    assert.plan(1);
    const store = new HttpHalStore({baseUrl: 'http://endpoint.mock.com/v1'});
    assert.ok(store instanceof HttpStore);
  });
});

/**
 * Tests: HttpHalStore.get(model, pk)
 */

test('store.get(model, pk) should transform response', (assert) => {
  assert.plan(1);
  // Setup request stub
  const rawResponse = {
    "id": "406b0752-e834-488e-8f8c-5f14c540cc06",
    "name": "Foo",
    "_links": {
      "self": {
        "href": "/items/406b0752-e834-488e-8f8c-5f14c540cc06"
      }
    },
    "_embedded": {
      "categories": {
        "id": "ecadb749-8098-48e0-90bf-bb94a6d95cb2",
        "_links": {
          "self": {
            "href": "/categories/ecadb749-8098-48e0-90bf-bb94a6d95cb2"
          }
        }
      }
    }
  }
  nock('http://endpoint.mock.com/v1').get('/api_items/b9d4621e-4abd-11e7-aa99-92ebcb67fe33').reply(200, rawResponse);
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `get`
  store.get('items', 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33').then((actual) => {
    assert.deepEquals(actual, {
      "id": "406b0752-e834-488e-8f8c-5f14c540cc06",
      "name": "Foo",
      "categories": {
        "id": "ecadb749-8098-48e0-90bf-bb94a6d95cb2",
        "_links": {
          "self": {
            "href": "/categories/ecadb749-8098-48e0-90bf-bb94a6d95cb2"
          }
        }
      }
    });
  });
});

/**
 * Tests: HttpHalStore.filter(model, query)
 */

test('store.filter(model, query) should transform response', (assert) => {
  assert.plan(1);
  // Setup request stub
  const rawResponse = {
    "_embedded": {
      "api_items": [
        {
          "id": "406b0752-e834-488e-8f8c-5f14c540cc06",
          "name": "Foo",
          "_links": {
            "self": {
              "href": "/api_items/406b0752-e834-488e-8f8c-5f14c540cc06"
            }
          },
          "_embedded": {
            "categories": [
              {
                "id": "ecadb749-8098-48e0-90bf-bb94a6d95cb2",
                "_links": {
                  "self": {
                    "href": "/categories/ecadb749-8098-48e0-90bf-bb94a6d95cb2"
                  }
                }
              }
            ]
          }
        }
      ]
    },
    "_links": {
      "self": {
        "href": "/api_items/47a2e55c-243e-46bc-aa27-02f3c0ca36c7/apps?page=0"
      },
      "next": {
        "href": "/api_items/47a2e55c-243e-46bc-aa27-02f3c0ca36c7/apps?page=1"
      }
    }
  }
  nock('http://endpoint.mock.com/v1').get('/api_items?name=Foo').reply(200, rawResponse)
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `filter`
  store.filter('items', {name: 'Foo'}).then((res) => {
    assert.deepEquals(res, [
      {
        "id": "406b0752-e834-488e-8f8c-5f14c540cc06",
        "name": "Foo",
        "categories": [
          {
            "id": "ecadb749-8098-48e0-90bf-bb94a6d95cb2",
            "_links": {
              "self": {
                "href": "/categories/ecadb749-8098-48e0-90bf-bb94a6d95cb2"
              }
            }
          }
        ]
      }
    ]);
  });
});

/**
 * Tests: HttpHalStore.create(model, data)
 */

test('store.create(model, data) should transform response', (assert) => {
  assert.plan(1);
  const data = {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
    name: 'Foo'
  };
  // Setup request stub
  nock('http://endpoint.mock.com/v1').post('/api_items').reply(201, {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
    name: 'Foo',
    _links: {
      "self": {
        "href": "/items/406b0752-e834-488e-8f8c-5f14c540cc06"
      }
    }
  });
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `create`
  store.create('items', data).then((res) => {
    assert.deepEquals(res, {
      id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
      name: 'Foo'
    });
  });
});

/**
 * Tests: HttpHalStore.update(model, data)
 */

test('store.update(model, data) should transform response', (assert) => {
  assert.plan(1);
  const data = {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
    name: 'Foo'
  };
  // Setup request stub
  nock('http://endpoint.mock.com/v1').put('/api_items/b9d4621e-4abd-11e7-aa99-92ebcb67fe33').reply(200, {
    id: 'b9d4621e-4abd-11e7-aa99-92ebcb67fe33',
    name: 'Foo',
    _links: {
      "self": {
        "href": "/items/406b0752-e834-488e-8f8c-5f14c540cc06"
      }
    }
  });
  // Setup store
  const store = generateStore('items', 'http://endpoint.mock.com/v1');
  // Assert correct `update`
  store.update('items', data).then((actual) => {
    assert.deepEquals(actual, data);
  });
});
