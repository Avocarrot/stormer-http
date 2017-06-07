'use strict'
const request = require('request');
const stormer = require('stormer');
const assert = require('assert');
const debug = require('debug')('store:http');

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
    this.createMethod = 'POST';
    this.updateMethod = 'PUT';
    this._request = request.defaults({
      timeout: options.timeout || 1000,
      json: options.json || true,
      baseUrl: options.baseUrl,
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
    return new Promise((resolve, reject) => this._request(options, function(err, res) {
      if (err) {
        debug(err);
        return reject(new HttpResponseError('Failed to fetch from endpoint'))
      }
      return resolve(res);
    }));
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
    return this._requestPromise({method: 'GET', url: `/${model.name}/${pk}`}).then((res) => {
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
    return this._requestPromise({method: 'GET', url: `/${model.name}`, qs: query, useQuerystring: true}).then((res) => {
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
    let method;
    let url;
    const recordId = data[model.schema.primaryKey];
    switch (operation) {
    case 'create':
      method = this.createMethod;
      url = `/${model.name}`;
      break;
    case 'update':
      method = this.updateMethod;
      url = `/${model.name}/${recordId}`;
      break;
    default:
      return Promise.reject(new Error(`Unsupported operation: "${operation}"`));
    }
    return this._requestPromise({method, url, formData: data}).then((res) => {
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
   * @param {Object} pk - Primary key
   * @return {Promise}
   *
   */
  _delete(model, pk) {
    return this._requestPromise({method: 'DELETE', url: `/${model.name}/${pk}`}).then((res) => {
      if (res.statusCode >= 400) {
        return Promise.reject(new HttpResponseError('Invalid "delete" response'))
      }
      return Promise.resolve(true);
    });
  }

}

module.exports = HttpStore;
