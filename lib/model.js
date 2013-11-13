var _ = require('underscore');
var Backbone = require('backbone');
var Relation = require('./relation');
var Collection = require('./collection');
var common = require('./common');

Model = module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    options || (options = {});

    var embedded = options.embedded;
    if (embedded) {
      this._parent = embedded.parent;
      this.urlRoot = function() {
        return common.embeddedUrl(this.parent, embedded.key);
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

  triggerUp: common.triggerUp,
  triggerMutation: common.triggerMutation,

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
      if (value) parsed[key] = new field(value, {
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
