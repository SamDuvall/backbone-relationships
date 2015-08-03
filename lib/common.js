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
