/**
 * @namespace Errors
 */

var util = require('util');

/**
 * @class HttpResponseError
 * @memberof Errors
 */
var HttpResponseError = function (message) {
  Error.captureStackTrace(this, this);
  this.message = message;
};

util.inherits(HttpResponseError, Error);
HttpResponseError.prototype.name = 'HttpResponseError';

module.exports = HttpResponseError;
