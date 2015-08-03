var _ = require('underscore');
var Backbone = require('backbone');

require('./lib/date');

module.exports = _.clone(Backbone);
_.extend(module.exports, {
  Relation: require('./lib/relation'),
  Model: require('./lib/model'),
  Collection: require('./lib/collection')
});
