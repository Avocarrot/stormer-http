'use strict'
const request = require('request');
const stormer = require('stormer');
const assert = require('assert');

const Store = stormer.Store;
const AlreadyExistsError = stormer.errors.AlreadyExistsError;
const NotFoundError = stormer.errors.NotFoundError;
const HttpResponseError = require('./errors/HttpResponseError');

/**
 * @class HttpStore
 * @extends Store
 *
 */
class HttpStore extends Store {

  /**
   * Generates an HttpStore instance
   *
   * @constructor
   * @memberof HttpStore
   * @param {Object} options
   * @return {HttpStore}
   *
   */
  constructor(options) {
    assert(options, 'options are required');
    super();
    this._request = request.defaults({
      headers: options.headers || {},
      timeout: options.timeout || 1000,
      baseUrl: options.baseUrl,
      forever: options.forever || true,
    });
  }

  /**
   * Wraps an HTTP request within a Promise
   *
   * @method _requestPromise
   * @memberof HttpStore
   * @param {Object} options
   * @return {Promise}
   *
   */
  _requestPromise(options) {
    return new Promise((resolve, reject) => this._request(options, function(err, httpResponse, responseBody) {
      if (err) {
        return reject(err);
      }
      const {statusCode} = httpResponse;
      // Ignore body for body-less responses
      if (!responseBody) {
        return resolve({statusCode});
      }
      // Objectify responses without content type headers
      const body = (options.json)? responseBody: JSON.parse(responseBody);
      return resolve({statusCode, body});
    }));
  }

  /**
   * Retrieves method to use in request
   *
   * @method _methodFor
   * @memberof HttpStore
   * @param {String} operation - The operation store will peform
   * @return {String} - Http method to use for the request
   *
   */
  _methodFor(operation) {
    switch(operation) {
    case 'delete':
      return 'DELETE';
    case 'create':
      return 'POST';
    case 'update':
      return 'PUT';
    case 'filter':
    case 'get':
    default:
      return 'GET';
    }
  }

  /**
   * Retrieves path to make the request
   *
   * @method _pathFor
   * @memberof HttpStore
   * @param {String} operation - The operation store will peform
   * @param {Object} model - The model
   * @param {Object} params - Params that are query, object and { pk } based on the operation
   * @return {String} - A path to use for the request
   *
   */
  _pathFor(operation, model, params = {}) {
    switch(operation) {
    case 'delete':
    case 'update': {
      let recordId = params[model.schema.primaryKey];
      return `/${model.name}/${recordId}`;
    }
    case 'get':
      return `/${model.name}/${params.pk}`;
    case 'create':
    case 'filter':
    default:
      return `/${model.name}`;
    }
  }

  /**
   * Prepares payload to be sent based on operation
   *
   * @method _payloadFor
   * @param {String} operation - The operation store will peform
   * @param {Object} model - The model
   * @param {Object} data - The data to be inserted in the payload
   * @return {Object} - The payload to use
   *
   */
  _payloadFor(operation, model, data) {
    return data;
  }

  /**
   * Retrieves an entry from the storage
   *
   * @method _get
   * @memberof HttpStore
   * @param {Object} model - The model
   * @param {String} pk - The object's primary key
   * @return {Promise} - A Promise
   *
   */
  _get(model, pk) {
    const method = this._methodFor('get');
    const url    = this._pathFor('get', model, { pk });
    return this._requestPromise({method, url}).then((res) => {
      if (res.statusCode === 404) {
        return Promise.reject(new NotFoundError(`Could not find "${model.name}" with primary key "${pk}"`))
      }
      return Promise.resolve(res.body);
    });
  }

  /**
   * Retrieves a filtered entry from the storage
   *
   * @method _filter
   * @memberof HttpStore
   * @param {Object} model - The model
   * @param {Objest} query - The query object
   * @return {Promise} - A Promise. The resolved value should be an array. Return empty array if none is natching the query.
   *
   */
  _filter(model, query) {
    const method = this._methodFor('filter');
    const url    = this._pathFor('filter', model, query);
    const payload = this._payloadFor('filter', model, query);

    return this._requestPromise({method, url, qs: payload}).then((res) => {
      if (res.statusCode >= 400) {
        return Promise.reject(new HttpResponseError('Invalid filter response'))
      }
      return Promise.resolve(res.body);
    });
  }

  /**
   * Retrieves an entry from the storage
   *
   * @method _set
   * @memberof HttpStore
   * @param {Object} model - The model
   * @param {Object} data - The data payload to push
   * @param {String} operation - The operation to perform
   * @return {Promise}
   *
   */
  _set(model, data, operation) {
    if (operation !== 'create' && operation !== 'update') {
      return Promise.reject(new Error(`Unsupported operation: "${operation}"`));
    }

    const method = this._methodFor(operation);
    const url    = this._pathFor(operation, model, data);
    const payload = this._payloadFor(operation, model, data);

    const headers= {'Content-Type': 'application/json;charset=UTF-8'};

    return this._requestPromise({method, url, body: payload, headers, json:true}).then((res) => {
      const recordId = data[model.schema.primaryKey];
      if (res.statusCode === 409) {
        return Promise.reject(new AlreadyExistsError(`Model for "${recordId}" already exists`))
      }
      if (res.statusCode >= 400) {
        return Promise.reject(new HttpResponseError(`Invalid "${operation}" response`))
      }
      return Promise.resolve(res.body);
    });
  }

  /**
   * Removes an entry from the storage
   *
   * @method _delete
   * @memberof HttpStore
   * @param {Object} model - The model
   * @param {Object} query
   * @return {Promise}
   *
   */
  _delete(model, query) {
    const method  = this._methodFor('delete');
    const url     = this._pathFor('delete', model, query);
    return this._requestPromise({method, url}).then((res) => {
      if (res.statusCode >= 400) {
        return Promise.reject(new HttpResponseError('Invalid "delete" response'))
      }
      return Promise.resolve(true);
    });
  }

}

module.exports = HttpStore;
