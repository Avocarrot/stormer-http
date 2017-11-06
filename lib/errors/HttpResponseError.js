/**
 * @namespace Errors
 */

var util = require('util');

/**
 * @class HttpResponseError
 * @memberof Errors
 */
var HttpResponseError = function(body) {
  Error.captureStackTrace(this, this);
  this.body = body;
};

util.inherits(HttpResponseError, Error);
HttpResponseError.prototype.name = 'HttpResponseError';

module.exports = HttpResponseError;
