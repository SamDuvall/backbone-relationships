(function (factory) {

  // For Node.js or CommonJS.
  if (typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'));

  // Finally, as a browser global.
  } else
    factory(_, Backbone);

}(function (_, Backbone) {

function triggerUp() { // Trigger all the way up the chain
  this.trigger.apply(this, arguments);
  if (this.parent) this.parent.triggerUp.apply(this.parent, arguments);
}

function triggerMutation(type) {
  this.triggerUp.apply(this, ['mutate'].concat(_.last(arguments, arguments.length)));
  this.triggerUp.apply(this, ['mutate:' + type].concat(_.last(arguments, arguments.length - 1)));
}

function embeddedUrl(model, key) {
  return model.url() + '/' + key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

if (!Date.fromJSON) Date.fromJSON = function(value) {
  if (_.isDate(value)) return value;
  if (_.isString(value)) return new Date(value.replace('T', ' ').substr(0, 19));
};

var Relation = {
  HasOne: HasOne,
  HasMany: HasMany,

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

function HasMany(options) {
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
          if(!(value instanceof Model)) value = new model(value);
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
      collection.reset(value);
    }

    return collection;
  }
});

function HasOne(options) {
  _.extend(this,options);
  this.keySource = this.keySource || this.key;
  this.keyDestination = this.keyDestination || this.key;
};

_.extend(HasOne.prototype, Relation.prototype, {
  initialize: function() {
    if(this._initialized) return;

    if(_.isString(this.relatedModel)) this.relatedModel = eval(this.relatedModel);

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
          return this[reverseCacheKey];
        },
        set: function(value) {
          if(!(value instanceof Backbone.Model)) value = new model(value);
          this[reverseCacheKey] = value;
        }
      });
    }

    this._initialized = true;
  },

  get: function(model) {
    return null;
  },

  set: function(model,value) {
    if(!value) return;
    if(!(value instanceof this.relatedModel)) value = new this.relatedModel(value, {
      reverse: {
        key: this.reverseKey,
        model: model
      }
    });
    return value;
  }
});

var Collection = Backbone.Collection.extend({
  constructor: function(attributes, options) {
    options || (options = {});

    var embedded = options.embedded;
    if (embedded) {
      this._parent = embedded.parent;
      this.url = function() {
        return embeddedUrl(this.parent, embedded.key);
      }
    }

    Backbone.Collection.call( this, attributes, options );
  },

  trigger: function(event) {
    Backbone.Collection.prototype.trigger.apply(this, arguments);

    // Trigger mutations
    if (event == 'add') {
      this.triggerMutation.apply(this, arguments);
    } else if (event == 'remove') {
      this.triggerMutation.apply(this, arguments);
    } else if (event == 'move') {
      this.triggerMutation.apply(this, arguments);
    }
  },

  triggerUp: triggerUp,
  triggerMutation: triggerMutation,

  move: function(model, newIndex) {
    var oldIndex = this.indexOf(model);

    this.models.splice(oldIndex, 1);
    this.models.splice(newIndex, 0, model);

    this.trigger('move', model, newIndex, this);
  }
});

Object.defineProperty(Collection.prototype, 'parent', {
  enumerable: true,
  get: function() {
    return this._parent;
  }
});

Object.defineProperty(Collection.prototype, 'root', {
  enumerable: true,
  get: function() {
    var parent = this.parent;
    return parent ? parent.root : this;
  }
});

var Model = Backbone.Model.extend({
  constructor: function(attributes, options) {
    options || (options = {});

    var embedded = options.embedded;
    if (embedded) {
      this._parent = embedded.parent;
      this.urlRoot = function() {
        return embeddedUrl(this.parent, embedded.key);
      }
    }

    var reverse = options.reverse;
    if (reverse) {
      this[reverse.key] = reverse.model;
    }

    Backbone.Model.apply( this, arguments );
  },

  trigger: function(event) {
    Backbone.Model.prototype.trigger.apply(this, arguments);

    // Trigger mutations
    if (event == 'change') {
      var previous = this.previousAttributes();
      if (_.keys(previous).length) {
        var changes = this.changedAttributes();
        this.triggerMutation('change', this, changes);
      }
    }
  },

  triggerUp: triggerUp,
  triggerMutation: triggerMutation,

  set: function(key, value, options) {
    var me = this;
    var attributes;

    if (_.isObject(key) || key == null) {
      attributes = key;
      options = value;

    } else {
      attributes = {};
      attributes[key] = value;
    }

    // Parse the attributes
    attributes = this.parseSchema(attributes);
    var relationAttrs = this.parseRelations(attributes);

    Backbone.Model.prototype.set.call(this, attributes, options);

    // Set the relations, do this after the set, so related
    // models can properly reference this model
    _.each(relationAttrs, function(value, key) {
      this[key] = value;
    }, this);

    return this;
  },

  parseSchema: function(attributes) {
    var parsed = _.clone(attributes);

    // SCHEMA
    _.each(this.fields, function (field, key) {
      var value = attributes[key];
      if (field.type) var fromJSON = field.type.fromJSON;
      if (value && fromJSON) parsed[key] = fromJSON(value, this);
    },this);

    // EMBEDDED
    _.each(this.embedded, function (field, key) {
      var value = attributes[key];
      if (value instanceof Model || value instanceof Collection) parsed[key] = value;
      else if (value) parsed[key] = new field(value, {
        embedded: {
          parent: this,
          key: key
        }
      });
    },this);

    return parsed;
  },

  parseRelations: function(attributes) {
    var parsed = {};

    // RELATIONS
    Relation.initialize();

    // Forward
    _.each(this.relations,function(relation) {
      var value = attributes[relation.keySource];
      if (value) {
        parsed[relation.key] = value;
        delete attributes[relation.keySource];
      }
    },this);

    // Reverse
    _.each(this.reverseKeys,function(reverseKey) {
      var value = attributes[reverseKey];
      if (value) {
        parsed[reverseKey] = value;
        delete attributes[reverseKey];
      }
    },this);

    return parsed;
  },

  toJSON: function(options) {
    // Default the options
    options = _.extend({},{
      relations: true,
      reverse: true
    },options);

    var json = Backbone.Model.prototype.toJSON.apply(this, arguments);
    json = this.decodeAttributes(json,options);
    return json;
  },

  decodeAttributes: function(attributes,options) {
    options = options || {};
    var decodedAttributes = _.clone(attributes);

    // REVERSE
    if(options.reverse) _.each(this.reverseKeys,function(key) {
      var model = this[key];
      if(model && model.id) decodedAttributes[key + "_id"] = model.id;
    },this);

    // FORWARD
    if(options.relations) _.each(this.relations,function(relation) {
      var value = this[relation.cacheKey]; // Use the cache key to avoid creating objects unnecessrily
      if(relation.keyDestination && value) decodedAttributes[relation.keyDestination] = value.toJSON({reverse: false});
    },this);

    // EMBEDDED
    if (this.embedded) _.keys(this.embedded).forEach(function(key) {
      var value = attributes[key];
      if (value) decodedAttributes[key] = value.toJSON();
    });

    // FIELDS
    if (this.fields) _.keys(this.fields).forEach(function(key) {
      var value = attributes[key];
      if (value && value.toJSON) decodedAttributes[key] = value.toJSON();
    });

    return decodedAttributes;
  },

  move: function(index) {
    this.collection.move(this, index);
  }
});

function addField(prototype, key, field) {
  prototype.fields = prototype.fields || {};
  prototype.fields[key] = field;

  Object.defineProperty(prototype, key, {
    enumerable: true,
    get: function() {
      return this.attributes[key];
    },
    set: function(value) {
      this.set(key, value);
    }
  });
};

function addEmbedded(prototype, key, field) {
  prototype.embedded = prototype.embedded || {};
  prototype.embedded[key] = field;

  Object.defineProperty(prototype, key, {
    enumerable: true,
    get: function() {
      return this.attributes[key];
    },
    set: function(value) {
      this.set(key, value);
    }
  });
};

// Add relations put on the prototype
Model.extend = function( protoProps, classProps ) {
  // Pull off any relations
  var schema = protoProps.schema;
  var relations = protoProps.relations;
  protoProps = _.omit(protoProps,'relations');

  var child = Backbone.Model.extend.apply( this, arguments );

  // Setup schema
  _.each(schema, function(field, key) {
    if (field.prototype instanceof Model) addEmbedded(child.prototype, key, field);
    else if (field.prototype instanceof Collection) addEmbedded(child.prototype, key, field);
    else addField(child.prototype, key, field);
  });

  // Setup relations
  _.each(relations,function(relation) {
    var relation = new Relation.build(relation);
    relation.register(child);
  });

  return child;
};

Object.defineProperty(Model.prototype, 'parent', {
  enumerable: true,
  get: function() {
    if (this.collection) return this.collection.parent;
    return this._parent;
  }
});

Object.defineProperty(Model.prototype, 'root', {
  enumerable: true,
  get: function() {
    var parent = this.parent;
    return parent ? parent.root : this;
  }
});

  return _.extend({}, Backbone, {
    Relation: Relation,
    Model: Model,
    Collection: Collection
  });
}));
