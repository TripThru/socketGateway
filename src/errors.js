function InvalidRequestError(resultCode, error) {
  this.resultCode = resultCode;
  this.error = error;
  Error.captureStackTrace(this, InvalidRequestError);
}
InvalidRequestError.prototype = Object.create(Error.prototype);
InvalidRequestError.prototype.constructor = InvalidRequestError;

function UnsuccessfulRequestError(resultCode, error) {
  this.resultCode = resultCode;
  this.error = error;
  Error.captureStackTrace(this, UnsuccessfulRequestError);
}
UnsuccessfulRequestError.prototype = Object.create(Error.prototype);
UnsuccessfulRequestError.prototype.constructor = UnsuccessfulRequestError;

module.exports.InvalidRequestError = InvalidRequestError;
module.exports.UnsuccessfulRequestError = UnsuccessfulRequestError;