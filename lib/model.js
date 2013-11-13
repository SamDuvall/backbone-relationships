var _ = require('underscore');
var Backbone = require('backbone');
var Relation = require('./relation');
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

    this.on('change', function(model) {
      var previous = this.previousAttributes();
      if (_.keys(previous).length) {
        var changes = this.changedAttributes();
        this.triggerMutation('change', model, changes);
      }
    }, this)
  },

  triggerUp: common.triggerUp,
  triggerMutation: common.triggerMutation,

  addField: function(key, field) {
    this.fields = this.fields || {};
    this.fields[key] = field;

    Object.defineProperty(this, key, {
      enumerable: true,
      get: function() {
        return this.attributes[key];
      },
      set: function(value) {
        this.set(key, value, {
          parse: true
        });
      }
    });
  },

  addEmbedded: function(key, field) {
    this.embedded = this.embedded || {};
    this.embedded[key] = field;

    Object.defineProperty(this, key, {
      enumerable: true,
      get: function() {
        return this.attributes[key];
      },
      set: function(value) {
        this.set(key, value, {
          parse: true
        });
      }
    });
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

  parse: function(attributes) {
    var encodedAttributes = _.clone(attributes);

    // SCHEMA
    _.each(this.fields, function (field, key) {
      var value = attributes[key];
      if (field.type) var fromJSON = field.type.fromJSON;
      if (value && fromJSON) encodedAttributes[key] = fromJSON(value, this);
    },this);

    // EMBEDDED
    _.each(this.embedded, function (field, key) {
      var value = attributes[key];
      if (value) encodedAttributes[key] = new field(value, {
        parse: true,
        embedded: {
          parent: this,
          key: key
        }
      });
    },this);

    // RELATIONS
    Relation.initialize();

    // Forward
    _.each(this.relations,function(relation) {
      var value = encodedAttributes[relation.keySource];
      delete encodedAttributes[relation.keySource];
      if(value) this[relation.key] = value;
    },this);

    // Reverse
    _.each(this.reverseKeys,function(reverseKey) {
      var value = encodedAttributes[reverseKey];
      delete encodedAttributes[reverseKey];
      if(value) this[reverseKey] = value;
    },this);

    return encodedAttributes;
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
},{
  addRelation: function(relation) {
    var relation = new Relation.build(relation);
    relation.register(this);
  }
});

// Add relations put on the prototype
Model.extend = function( protoProps, classProps ) {
  // Pull off any relations
  var schema = protoProps.schema;
  var relations = protoProps.relations;
  protoProps = _.omit(protoProps,'relations');

  var child = Backbone.Model.extend.apply( this, arguments );

  // Setup schema
  _.each(schema, function(field, key) {
    if (_.isFunction(field)) child.prototype.addEmbedded(key, field);
    else child.prototype.addField(key, field);
  });

  // Setup relations
  _.each(relations,function(relation) {
    child.addRelation(relation);
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
