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
