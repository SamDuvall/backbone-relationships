(function (factory) {

  // For Node.js or CommonJS.
  if (typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'));

  // Finally, as a browser global.
  } else
    factory(_, Backbone);

}(function (_, Backbone) {
