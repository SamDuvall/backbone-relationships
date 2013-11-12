var Backbone = require('../backbone-relationships.js');

global.Image = Backbone.Model.extend({
  schema: {
    created_at: { type: Date },
    url: { type: String }
  },

  getUrl: function() {
    return this.url;  
  }
});

global.Image.Collection = Backbone.Collection.extend({
  model: global.Image
});

global.Team = Backbone.Model.extend({
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
  schema: {
    name: { type: String },
    created_at: { type: Date }
  }
});

global.Player = Backbone.Model.extend({
  schema: {
    name: { type: String },
    created_at: { type: Date }
  }
});
