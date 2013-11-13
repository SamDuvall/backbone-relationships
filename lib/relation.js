var _ = require('underscore');

var Relation = module.exports = {
  build: function(options) {
    var type = options.type;
    options = _.omit(options,'type');
    var constructor = _.isString(type) ? Relation[type] : type;
    return new constructor(options);
  },

  relations: [],

  register: function(relation) {
    this.relations.push(relation);
  },

  initialize: function() {
    _.each(this.relations,function(relation) {
      relation.initialize();
    });
  },

  prototype: {
    register: function(model) {
      var relation = this;
      var cacheKey = this.cacheKey = this.cacheKey || '_' + this.key;

      // Set the model we are on
      this.model = model;

      // Register the object property to access this relation
      Object.defineProperty(model.prototype, this.key, {
        enumerable: true,
        get: function() {
          if(!this[cacheKey]) this[cacheKey] = relation.get(this);
          return this[cacheKey];
        },
        set: function(value) {
          this[cacheKey] = relation.set(this,value);
        }
      });

      // Register to the prototype
      model.prototype.relations = model.prototype.relations || {};
      model.prototype.relations[relation.key] = relation;

      // Register the relation for initialization
      Relation.register(this);
    }
  }
};

Relation.HasOne = require('./relation/has-one');
Relation.HasMany = require('./relation/has-many');