'use strict'
const HttpStore = require('./http-store');

/**
 * Recursively gilters out `_links` and flattens `_embedded` records in response
 *
 * @function transformResponseData
 * @param {Object} payload
 * @return {Object}
 *
 */
const transformResponseData = (payload = {}) => {
  return Object.keys(payload).reduce((response, key) => {
    switch (key) {
    case '_links':
      // Ingore links
      break;
    case '_embedded':
      // Unwrapp _embedded records
      Object.keys(payload['_embedded']).forEach((embeddedPayloadKey) => {
        const embeddedPayload = payload['_embedded'][embeddedPayloadKey];
        if (embeddedPayload instanceof Array) {
          response[embeddedPayloadKey] = [].concat(embeddedPayload.map(transformResponse));
        }
        response[embeddedPayloadKey] = transformResponse(embeddedPayload)
      });
      break;
    default:
      // Attach remaining payload key value pairs
      response[key] = payload[key];
    }
    return response;
  }, {});
}

/**
  * Transform error body from vnd.error (HAL) format to jsonapi
  *
  * @function transformError
  * @param {Object} error
  * @response {Object}
  *
  */
const transformError = (error) => {
  return Promise.reject(transformResponseData(error));
}

/**
 * Transforms a response Object or an Array of response Objects
 *
 * @function transformResponse
 * @param {Object} payload
 * @return {Object}
 *
 */
const transformResponse = (response) => {
  if (response instanceof Array) {
    return response.map((record) => transformResponseData(record));
  }
  return transformResponseData(response);
}

/**
 * @class HttpHalStore
 * @extends HttpStore
 */
class HttpHalStore extends HttpStore {

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
    return super._get(model, pk).then(transformResponse).catch(transformError);
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
    return super._filter(model, query).then(transformResponse).catch(transformError);
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
    return super._set(model, data, operation).then(transformResponse).catch(transformError);
  }

}

module.exports = HttpHalStore;
