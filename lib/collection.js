var _ = require('underscore');
var Backbone = require('backbone');
var common = require('./common');

var Collection = module.exports = Backbone.Collection.extend({
  constructor: function(attributes, options) {
    options || (options = {});

    var embedded = options.embedded;
    if (embedded) {
      this._parent = embedded.parent;
      this.url = function() {
        return common.embeddedUrl(this.parent, embedded.key);
      }
    }

    Backbone.Collection.call( this, attributes, options );

    this.on('add', function(model) {
      this.triggerMutation('add', model, this);
    }, this);

    this.on('remove', function(model) {
      this.triggerMutation('remove', model, this);
    }, this);

    this.on('move', function(model, newIndex) {
      this.triggerMutation('move', model, newIndex, this);
    }, this);
  },

  triggerUp: common.triggerUp,
  triggerMutation: common.triggerMutation,

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