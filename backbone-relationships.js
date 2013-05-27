(function() {

  /**
   * CommonJS shim
   **/
  var _, OldBackbone, Backbone, exports;
  if ( typeof window === 'undefined' ) {
    _ = require( 'underscore' );
    OldBackbone = require( 'backbone' );
    Backbone = _.clone(OldBackbone);
    exports = module.exports = Backbone;
  }
  else {
    _ = window._;
    OldBackbone = window.Backbone;
    Backbone = window.Backbone = _.clone(OldBackbone);
    exports = window;
  }

  // Out of the box conversions

  if(!Date.fromJSON) Date.fromJSON = function(value) {
    if (_.isDate(value)) return value;
    if (_.isString(value)) return new Date(value.replace('T', ' ').substr(0, 19));
  };

  // CODECS

  Backbone.Codec = function(field) {
    this.key = field.name;
    this.fields = [this.key];
    this.encode = field.codec.fromJSON;
  };

  _.extend(Backbone.Codec.prototype, {
    decode: function(value) {
      var attributes = {};
      attributes[this.key] = value.toJSON();
      return attributes;
    }
  });

  // RELATIONS

  Backbone.Relation = {
    build: function(options) {
      var type = options.type;
      options = _.omit(options,'type');
      var constructor = _.isString(type) ? Backbone.Relation[type] : type;
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
    }
  };

  var relationPrototype = {
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
      Backbone.Relation.register(this);
    }
  };

  // RELATIONS - HAS ONE

  Backbone.Relation.HasOne = function(options) {
    _.extend(this,options);
    this.keySource = this.keySource || this.key;
    this.keyDestination = this.keyDestination || this.key;
  };

  _.extend(Backbone.Relation.HasOne.prototype,relationPrototype,{
    initialize: function() {
      if(this._initialized) return;

      if(_.isString(this.relatedModel)) this.relatedModel = eval(this.relatedModel);

      // REVERSE RELATION
      var model = this.model;
      var key = this.key;
      var reverseKey = this.reverseKey;

      // Add to prototype
      var relatedPrototype = this.relatedModel.prototype;
      relatedPrototype.reverseRelations = relatedPrototype.reverseRelations || {};
      relatedPrototype.reverseRelations[reverseKey] = this;

      // Access via the reverse key (e.g. coach.team = team)
      Object.defineProperty(this.relatedModel.prototype, reverseKey, {
        enumerable: true,
        get: function() {
          if(this.belongsTo) return this.belongsTo[reverseKey];
        },
        set: function(owner) {
          // Break recursion
          var currentOwner = this[reverseKey];
          if(currentOwner === owner) return;

          // Initialize belongs to
          this.belongsTo = this.belongsTo || {};

          // Remove from existing owner
          if(currentOwner) currentOwner[key] = null;
          delete this.belongsTo[reverseKey];

          // Set new owner
          if(owner) {
            if(!(owner instanceof Backbone.Model)) owner = new model(owner);
            this.belongsTo[reverseKey] = owner;
            owner[key] = this;
          }
        }
      });

      this._initialized = true;
    },

    get: function(model) {
      return null;
    },

    set: function(model,value) {
      if(!value) return;
      if(!(value instanceof this.relatedModel)) value = new this.relatedModel(value);
      value[this.reverseKey] = model;
      return value;
    }
  });

  // RELATIONS - HAS MANY

  Backbone.Relation.HasMany = function(options) {
    _.extend(this,options);
    this.keySource = this.keySource || this.key;
    this.keyDestination = this.keyDestination || this.key;
  };

  _.extend(Backbone.Relation.HasMany.prototype,relationPrototype,{
    initialize: function() {
      if(this._initialized) return;

      if(_.isString(this.relatedModel)) this.relatedModel = eval(this.relatedModel);
      if(_.isString(this.collectionType)) this.collectionType = eval(this.collectionType);
     
      // REVERSE RELATION
      var model = this.model;
      var key = this.key;
      var reverseKey = this.reverseKey;

      // Add to prototype
      var relatedPrototype = this.relatedModel.prototype;
      relatedPrototype.reverseRelations = relatedPrototype.reverseRelations || {};
      relatedPrototype.reverseRelations[reverseKey] = this;

      // Access via the reverse key (e.g. player.team)
      Object.defineProperty(this.relatedModel.prototype, reverseKey, {
        enumerable: true,
        get: function() {
          if(this.collection && this.collection.belongsTo) return this.collection.belongsTo[reverseKey];
        },
        set: function(owner) {
          // Remove from existing owner
          if(this.collection) this.collection.remove(this);
          // Add to new owner
          if(!(owner instanceof Backbone.Model)) owner = new model(owner);
          owner[key].add(this);
        }
      });

      this._initialized = true;
    },

    get: function(model) {
      // Create the collection
      if(this.collectionType) {
        var collection = new this.collectionType();
      } else {
        var collection = new Backbone.Collection();
        collection.model = this.relatedModel;
      }

      // Tell the collection it belongs to us
      collection.belongsTo = collection.belongsTo || {};
      collection.belongsTo[this.reverseKey] = model;

      return collection;
    },

    set: function(model,value) {
      if(value instanceof Backbone.Collection) {
        var collection = value;
      } else {
        var collection = model[this.key]
        collection.reset(value);
      }

      return collection;
    }
  });

  // MODEL

  Backbone.Model = Backbone.Model.extend({
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

      attributes = this.encodeAttributes(attributes);

      return OldBackbone.Model.prototype.set.call(this, attributes, options);
    },

    toJSON: function(options) {
      // Default the options
      options = _.extend({},{
        relations: true,
        reverseRelations: true
      },options);

      var json = OldBackbone.Model.prototype.toJSON.apply(this, arguments);
      json = this.decodeAttributes(json,options);
      return json;
    },

    encodeAttributes: function(attributes) {
      var encodedAttributes = _.clone(attributes);

      // CODECS
      _.each(this.codecs, function (codec,key) {
        codec.fields.forEach(function (field) {
          delete encodedAttributes[field];
        });
        var values = _.values(_.pick(attributes, codec.fields));
        if (values.length == codec.fields.length) encodedAttributes[key] = codec.encode.apply(codec, values);
      },this);

      // RELATIONS
      Backbone.Relation.initialize();

      // Forward
      _.each(this.relations,function(relation) {
        var value = encodedAttributes[relation.keySource];
        delete encodedAttributes[relation.keySource];
        if(value) this[relation.key] = value;
      },this);

      // Reverse
      _.each(this.reverseRelations,function(relation,reverseKey) {
        var value = encodedAttributes[reverseKey];
        delete encodedAttributes[reverseKey];
        if(value) this[reverseKey] = value;
      },this);

      return encodedAttributes;
    },

    decodeAttributes: function(attributes,options) {
      options = options || {};
      var decodedAttributes = _.clone(attributes);

      // REVERSE RELATIONS
      if(options.reverseRelations) _.each(this.reverseRelations,function(relation,key) {
        var model = this[key];
        if(model && model.id) decodedAttributes[key + "_id"] = model.id;
      },this);

      // RELATIONS
      if(options.relations) _.each(this.relations,function(relation) {
        var value = this[relation.cacheKey]; // Use the cache key to avoid creating objects unnecessrily
        if(relation.keyDestination && value) decodedAttributes[relation.keyDestination] = value.toJSON({reverseRelations: false});
      },this);

      // CODECS
      var codecs = _.pick(this.codecs, _.keys(attributes));
      _.each(codecs, function (codec,key) {
        delete decodedAttributes[key];
        _.extend(decodedAttributes, codec.decode(attributes[key]));
      });
      
      return decodedAttributes;
    }
  });

  Object.defineProperty(Backbone.Model.prototype, 'codecs', {
    enumerable: true,
    get: function() {
      if(this._codecs) return this._codecs;

      var codecs = this._codecs = {};
      _.select(this.fields,function(field) {
        if(field.codec && !(field.codec instanceof Backbone.Codec)) field.codec = new Backbone.Codec(field);
        if(field.codec) codecs[field.name] = field.codec;
      });
      return codecs;
    }
  });

  _.extend(Backbone.Model,{
    addRelation: function(relation) {
      var relation = new Backbone.Relation.build(relation);
      relation.register(this);
    }
  });

  // Add relations put on the prototype
  Backbone.Model.extend = function( protoProps, classProps ) {
    // Pull off any relations
    var relations = protoProps.relations;
    protoProps = _.omit(protoProps,'relations');

    var child = OldBackbone.Model.extend.apply( this, arguments );

    // Setup relations
    _.each(relations,function(relation) {
      child.addRelation(relation);
    });      

    return child;
  };


  var array = [];
  var slice = array.slice;

  // Underscore methods that we want to implement on the Collection.
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'sortedIndex', 'toArray', 'size', 'first', 'head', 'take',
    'initial', 'rest', 'tail', 'last', 'without', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  var applyMethods = function(prototype) {
    _.each(methods, function(method) {
      prototype[method] = function() {
        var args = slice.call(arguments);
        args.unshift(this.models);
        return _[method].apply(_, args);
      };
    });
  }

  // Set of a collection based on a simple filter

  Backbone.Collection.Subset = function(collection, filter) {
    var me = this;
    this.collection = collection;
    this.filter = filter;

    this.collection.on('reset', function() {
      this.reset();
      this.trigger('reset', this.models);
    }, this);

    this.collection.on('add', function(model) {
      if (filter(model)) {
        this.reset();
        this.trigger('add', model);
      }
    }, this);

    this.collection.on('remove', function(model) {
      if (filter(model)) {
        this.reset();
        this.trigger('remove', model);
      }
    }, this);
    
    this.reset();
  }

  _.extend(Backbone.Collection.Subset.prototype, Backbone.Events, {
    reset: function() {
      this.models = _.filter(this.collection.models, function(model) {
        return this.filter(model);
      }, this);
      this.length = this.models.length;
    },

    setFilter: function(filter) {
      this.filter = filter;
      this.reset();
    }
  });

  applyMethods(Backbone.Collection.Subset.prototype);

  _.extend(Backbone.Collection.prototype, {
    subset: function(filter) {
      return new Backbone.Collection.Subset(this, filter);
    }
  });

}).call(this);