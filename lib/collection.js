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
