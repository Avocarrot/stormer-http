'use strict'
const request = require('request');
const util = require('util');
const stormer = require('stormer');
const assert = require('assert');
const qs = require('qs');

const Store = stormer.Store;
const NotFoundError = stormer.errors.NotFoundError;

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
   * @param {Object} requestClient - The request client to use
   * @param {Object} options
   * @return {HttpStore}
   *
   */
  constructor(requestClient = request, options) {
    assert(request, 'request is required');
    assert(options, 'options are required');
    super();
    this._request = requestClient;
    this._timeout = options.timeout || 1000;
    this._baseUrl = options.baseUrl;
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
        return reject(err);
      }
      return resolve(res.body);
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
    return this._requestPromise({
      method: 'GET',
      url: util.format('%s/%s/%s', this._baseUrl, model.name, pk)
    }).catch(() => {
      return Promise.reject(new NotFoundError(util.format('Could not find `%s` with primary key "%s"', model.name, pk)))
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
    return this._requestPromise({
      method: 'GET',
      url: util.format('%s/%s?%s', this._baseUrl, model.name, qs.stringify(query))
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
    switch (operation) {
    case 'create':
      method = 'POST';
      url = util.format('%s/%s', this._baseUrl, model.name);
      break;
    case 'update':
      method = 'PATCH';
      url = util.format('%s/%s/%s', this._baseUrl, model.name, data[model.schema.primaryKey]);
      break;
    default:
      return Promise.reject(new Error(util.format('Unsupported operation: "%s"', operation)));
    }
    return this._requestPromise({method, url, formData: data});
  }

  /**
   * Removes an entry from the storage
   *
   * @method _delete
   * @memberof HttpStore
   * @return {Promise}
   *
   */
  _delete() {
    return Promise.reject(new Error('Store.prototype._delete() is not implemented'));
  }

}

module.exports = HttpStore;
