var _ = require('underscore');
var Backbone = require('backbone');
var Relation = require('../relation');
var Model = require('../model')
var Collection = require('../collection')

var HasMany = module.exports = function(options) {
  _.extend(this,options);
  this.keySource = this.keySource || this.key;
  this.keyDestination = this.keyDestination || this.key;
};

_.extend(HasMany.prototype, Relation.prototype, {
  initialize: function() {
    if(this._initialized) return;

    if(_.isString(this.relatedModel)) this.relatedModel = eval(this.relatedModel);
    if(_.isString(this.collectionType)) this.collectionType = eval(this.collectionType);
   
    var model = this.model;
    var key = this.key;
    var reverseKey = this.reverseKey;
    var reverseCacheKey = '_' + reverseKey;

    // Add reverse key
    var relatedPrototype = this.relatedModel.prototype;
    var reverseKeys = relatedPrototype.reverseKeys = relatedPrototype.reverseKeys || [];
    if (!_.contains(reverseKeys, reverseKey)) {
      reverseKeys.push(reverseKey);

      Object.defineProperty(this.relatedModel.prototype, reverseKey, {
        enumerable: true,
        get: function() {
          if (this[reverseCacheKey]) return this[reverseCacheKey];
          if (this.collection) return this.collection[reverseKey];
        },
        set: function(value) {
          if(!(value instanceof Model)) value = new model(value, {
            parse: true
          });
          this[reverseCacheKey] = value;
        }
      });
    }

    this._initialized = true;
  },

  get: function(model) {
    // Create the collection
    if(this.collectionType) {
      var collection = new this.collectionType();
    } else {
      var collection = new Collection();
      collection.model = this.relatedModel;
    }

    // Tell the collection it belongs to us
    collection[this.reverseKey] = model;

    return collection;
  },

  set: function(model,value) {
    if(value instanceof Collection) {
      var collection = value;
    } else {
      var collection = model[this.key]
      collection.reset(value, {
        parse: true
      });
    }

    return collection;
  }
});
