/**
 * @file Promises/A+ Test Adapter
 * @author lxx2013
 */

var Promise = require("./apromise");

exports.resolved = undefined //Promise.resolve;
exports.rejected = undefined //Promise.reject;

exports.deferred = function() {
  var resolve, reject;
  var promise = new Promise(function(_resolve, _reject) {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise: promise,
    resolve: resolve,
    reject: reject
  };
};
