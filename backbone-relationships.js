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

  if (!Date.fromJSON) Date.fromJSON = function(value) {
    if (_.isDate(value)) return value;
    if (_.isString(value)) return new Date(value.replace('T', ' ').substr(0, 19));
  };

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
    addField: function(key, field) {
      Object.defineProperty(this, key, {
        configurable: true,
        enumerable: true,
        get: function() {
          return this.attributes[key];
        },
        set: function(value) {
          this.set(key, value);
        }
      });
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

    parse: function(attributes) {
      var encodedAttributes = _.clone(attributes);

      // SCHEMA
      _.each(this.schema, function (field, key) {
        var value = attributes[key];
        if (field.type) var fromJSON = field.type.fromJSON;
        if (value && fromJSON) encodedAttributes[key] = fromJSON(value);
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

      // SCHEMA
      _.keys(this.schema).forEach(function(key) {
        var value = attributes[key];
        if (value && value.toJSON) decodedAttributes[key] = value.toJSON();
      });
      
      return decodedAttributes;
    }
  },{
    addRelation: function(relation) {
      var relation = new Backbone.Relation.build(relation);
      relation.register(this);
    }
  });

  // Add relations put on the prototype
  Backbone.Model.extend = function( protoProps, classProps ) {
    // Pull off any relations
    var schema = protoProps.schema;
    var relations = protoProps.relations;
    protoProps = _.omit(protoProps,'relations');

    var child = OldBackbone.Model.extend.apply( this, arguments );

    // Setup schema
    _.each(schema, function(field, key) {
      child.prototype.addField(key, field);
    });

    // Setup relations
    _.each(relations,function(relation) {
      child.addRelation(relation);
    });      

    return child;
  };

}).call(this);