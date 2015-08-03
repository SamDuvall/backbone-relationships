var Backbone = require('../backbone-relationships');
console.log(Backbone);

global.Image = Backbone.Model.extend({
  schema: {
    created_at: { type: Date },
    ref: { type: String }
  },

  urlRoot: function() {
    return this.parent.url() + '/images';
  },

  getPath: function() {
    return this.ref;
  }
});

global.Image.Collection = Backbone.Collection.extend({
  model: global.Image
});

global.Team = Backbone.Model.extend({
  urlRoot: '/teams',

  schema: {
    name: { type: String },
    created_at: { type: Date },
    logo: Image,
    images: Image.Collection
  },

  relations: [{
    type: Backbone.Relation.HasOne,
    key: 'coach',
    keyDestination: 'coach_attributes',
    reverseKey: 'team',
    relatedModel: 'Coach'
  },{
    type: Backbone.Relation.HasOne,
    key: 'assistant',
    keyDestination: 'assistant_attributes',
    reverseKey: 'team',
    relatedModel: 'Coach'
  },{
    type: Backbone.Relation.HasMany,
    key: 'players',
    keyDestination: 'player_attributes',
    reverseKey: 'team',
    relatedModel: 'Player'
  }]
});

global.Coach = Backbone.Model.extend({
  urlRoot: '/coaches',

  schema: {
    name: { type: String },
    created_at: { type: Date }
  }
});

global.Player = Backbone.Model.extend({
  urlRoot: '/players',

  schema: {
    name: { type: String },
    created_at: { type: Date }
  }
});
