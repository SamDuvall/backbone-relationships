var Backbone = require('../backbone-relationships.js');

global.Team = Backbone.Model.extend({
  fields: [
    {name: 'name'},
    {name: 'created_at', codec: Date}
  ],
  
  relations: [{
    type: Backbone.Relation.HasOne,
    key: 'coach',
    keyDestination: 'coach_attributes',
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
  fields: [
    {name: 'name'},
    {name: 'created_at', codec: Date}
  ]
});

global.Player = Backbone.Model.extend({
  fields: [
    {name: 'name'},
    {name: 'created_at', codec: Date}
  ]
});
