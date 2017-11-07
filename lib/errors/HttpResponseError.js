/**
 * @namespace Errors
 */

var util = require('util');

/**
 * @class HttpResponseError
 * @memberof Errors
 */
var HttpResponseError = function(body, status) {
  Error.captureStackTrace(this, this);
  if (typeof body === 'object') {
    Object.keys(body).forEach((el) => this[el] = body[el]);
  } else {
    this.body = body;   
  }
  this.httpStatus = status;
};

util.inherits(HttpResponseError, Error);
HttpResponseError.prototype.name = 'HttpResponseError';

module.exports = HttpResponseError;
