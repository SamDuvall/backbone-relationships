var _ = require('underscore');

module.exports = {
  triggerUp: function() { // Trigger all the way up the chain
    this.trigger.apply(this, arguments);
    if (this.parent) this.parent.triggerUp.apply(this.parent, arguments);
  },

  triggerMutation: function(type) {
    this.triggerUp.apply(this, ['mutate'].concat(_.last(arguments, arguments.length)));
    this.triggerUp.apply(this, ['mutate:' + type].concat(_.last(arguments, arguments.length - 1)));   
  },

  embeddedUrl: function(model, key) {
    return model.url() + '/' + key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
}
