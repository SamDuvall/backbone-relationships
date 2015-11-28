backbone-relationships
==================

backbone-relationships provides a way to specify 1:1 and 1:N relationships between Backbone models and collections.  It combines the speed and low memory footprint of [Backbone Associations](https://github.com/dhruvaray/backbone-associations) with the versatility of [Backbone Relational](https://github.com/PaulUithol/Backbone-relational)...and more!

# Codecs
Codecs provide a way to decode and encode attributes going back and forth to the server.  Each codec must provide a toJson on the object and a fromJson on the prototype.

**Date Example**

 A common use case for this to to convert a date from the server to a Date on the client and vice versa going back to the server.

    var ExampleModel = Backbone.Model.extend({
      fields: {
         created_at: {type: Date}
      }
    });

The following statement will return a Date object

    var example = new ExampleModel({created_at: '2012-12-17T13:30:59-08:00Z'});
    example.get('created_at') instanceof Date; // Returns true

Calling toJSON will return the date back to a string

    example.toJSON().created_at == '2012-12-17T13:30:59-08:00Z'; // Returns true

# Relations
Here are the key benefits of relations in backbone-relationships over the other libraries.

- Allows reverse relationships (i.e. belongs to) - Backbone Associations
- Does not keep global collections, which either leads to memory bloat or memory management - Backbone Relational
- Creates relation models and collections on-demand instead of every construction. - Backbone Relational/Associations

**Example**

Below is an example of a model with a 1:1 (HasOne) relation and 1:N (HasMany) relation.

    var Team = Backbone.Model.extend({
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

    var Coach = Backbone.Model.extend({
      fields: {
        name: {type: String},
        created_at: {type: Date}
      }
    });

    var Player = Backbone.Model.extend({
      fields: {
        name: {type: String},
        created_at: {type: Date}
      }
    });

The following object...

    var team = new Team({
      id: 1,
      name: 'Rocket Whale',
      coach: {
        name: 'Dean'
      },
      players: [{
        name: 'Sam'
      },{
        name: 'Tom'
      }
    });

...makes the following calls true

    team.get('name') == 'Rocket Whale'
    team.coach.get('name') == 'Dean'
    team.coach.team === team
    team.players.length == 2
    team.players.first().get('name') == 'Sam'
    team.players.first().team === team
