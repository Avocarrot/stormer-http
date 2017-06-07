'use strict'
const HttpStore = require('./http-store');

/**
 * Filters out `_links` and flattens `_embedded` records in array response
 *
 * @function transformEmbeddedArray
 * @param {Array} recordArray
 * @return {Object}
 *
 */
const transformEmbeddedArray = (recordArray) => recordArray.map((record) => {
  return Object.keys(record).reduce((obj, key) => {
    switch (key) {
    case '_embedded':
      Object.keys(record['_embedded']).forEach((embeddedKey) => {
        obj[embeddedKey] = record['_embedded'][embeddedKey]
      });
      return obj;
    case '_links':
      return obj;
    default:
      obj[key] = record[key];
      return obj;
    }
  }, {});
});

/**
 * Filters out `_links` and flattens `_embedded` records in single response
 *
 * @function transformEmbeddedRecord
 * @param {Object} record
 * @return {Object}
 *
 */
const transformEmbeddedRecord = (record) => transformEmbeddedArray([record])[0];

/**
 * @class HttpHalStore
 * @extends HttpStore
 */
class HttpHalStore extends HttpStore {

  /**
   * Generates an HttpStore instance
   *
   * @constructor
   * @memberof HttpHalStore
   * @param {Object} options
   * @return {HttpStore}
   *
   */
  constructor(options) {
    options['content-type'] = 'application/hal+json';
    super(options);
  }

  /**
   * Retrieves an entry from the storage
   *
   * @method _get
   * @memberof HttpHalStore
   * @param {Object} model - The model
   * @param {String} pk - The object's primary key
   * @return {Promise} - A Promise
   *
   */
  _get(model, pk) {
    return super._get(model, pk).then((data) => transformEmbeddedRecord(data))
  }

  /**
   * Retrieves a filtered entry from the storage
   *
   * @method _filter
   * @memberof HttpHalStore
   * @param {Object} model - The model
   * @param {Objest} query - The query object
   * @return {Promise} - A Promise. The resolved value should be an array. Return empty array if none is natching the query.
   *
   */
  _filter(model, query) {
    return super._filter(model, query).then((data) => transformEmbeddedArray(data._embedded[model.name]));
  }

  /**
   * Retrieves an entry from the storage
   *
   * @method _set
   * @memberof HttpHalStore
   * @param {Object} model - The model
   * @param {Object} data - The data payload to push
   * @param {String} operation - The operation to perform
   * @return {Promise}
   *
   */
  _set(model, data, operation) {
    return super._set(model, data, operation).then((data) => transformEmbeddedRecord(data));
  }

}

module.exports = HttpHalStore;
