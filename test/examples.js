var Backbone = require('../backbone-relationships.js');

global.Team = Backbone.Model.extend({
  schema: {
    name: { type: String },
    created_at: { type: Date }
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
