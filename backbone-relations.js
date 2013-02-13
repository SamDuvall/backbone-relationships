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
    OldBackbone = window.OldBackbone;
    Backbone = window.Backbone = _.clone(OldBackbone);
    exports = window;
  }

  // Out of the box conversions

  Date.fromJSON = function(value) {
    if (_.isDate(value)) return value;
    if (_.isString(value)) return new Date(value.replace('T', ' ').substr(0, 19));
  }

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

      // Clone the attributes, so we don't clobber what the user passes in
      attributes = _.clone(attributes || {});
      attributes = this.encodeAttributes(attributes);

      return OldBackbone.Model.prototype.set.call(this, attributes, options);
    },

    toJSON: function() {
      var json = OldBackbone.Model.prototype.toJSON.apply(this, arguments);
      json = this.decodeAttributes(json);
      return json;
    },

    encodeAttributes: function(attributes) {
      var encodedAttributes = _.clone(attributes);

      _.each(this.codecs, function (codec,key) {
        codec.fields.forEach(function (field) {
          delete encodedAttributes[field];
        });
        var values = _.values(_.pick(attributes, codec.fields));
        if (values.length == codec.fields.length) encodedAttributes[key] = codec.encode.apply(codec, values);
      });

      return encodedAttributes;
    },

    decodeAttributes: function(attributes) {
      var decodedAttributes = _.clone(attributes);

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

}).call(this);