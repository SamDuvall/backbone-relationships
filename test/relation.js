require('./examples');
var expect = require('expect.js'),
    Backbone = require('../backbone-relationships.js');

describe('Backbone.Relation', function() {
  describe('HasOne', function() {
    describe('none', function() {
      var team;

      beforeEach(function() {
        team = new Team({
          name: 'Rocket Whale'
        });
      });

      it('should encode', function() {
        expect(team.coach).to.be(null);
      });

      it('should decode', function() {
        var json = team.toJSON();
        expect(json).to.eql({
          name: 'Rocket Whale'
        });
      });
    });

    describe('full', function() {
      var team;

      beforeEach(function() {
        team = new Team({
          id: 1,
          name: 'Rocket Whale',
          coach: {
            name: 'Scuba Steve'
          }
        });
      });

      it('should encode', function() {
        expect(team.coach).to.be.a(Backbone.Model);
      });

      it('should decode', function() {
        var teamJson = team.toJSON();
        expect(teamJson).to.eql({
          id: 1,
          name: 'Rocket Whale',
          coach_attributes: {
            name: 'Scuba Steve'
          }
        });

        var coachJson = team.coach.toJSON();
        expect(coachJson).to.eql({
          team_id: 1,
          name: 'Scuba Steve'
        });
      });
    });

    describe('belongs To', function() {
      var coach;

      beforeEach(function() {
        coach = new Coach({
          name: 'Scuba Steve',
          team: {
            id: 1,
            name: 'Rocket Whale'
          }
        })
      });

      it('should encode', function() {
        expect(coach.team).to.be.a(Backbone.Model);
      });

      it('should decode', function() {
        var coachJson = coach.toJSON();
        expect(coachJson).to.eql({
          team_id: 1,
          name: 'Scuba Steve'
        });
      });

      it('change owner', function() {
        var originalTeam = coach.team;
        var newTeam = new Team();
        coach.team = newTeam;

        expect(coach.team).to.be(newTeam);
        expect(originalTeam.coach).to.be(null);
        expect(newTeam.coach).to.be(coach);
      });
    });
  });

  describe('HasMany', function() {
    describe('none', function() {
      var team;

      beforeEach(function() {
        team = new Team({
          name: 'Rocket Whale'
        });
      });

      it('should encode', function() {
        expect(team.players).to.be.a(Backbone.Collection);
        expect(team.players.length).to.be(0);
      });

      it('should decode', function() {
        var json = team.toJSON();
        expect(json).to.eql({
          name: 'Rocket Whale'
        });
      });
    });

    describe('many', function() {
      var team;

      beforeEach(function() {
        team = new Team({
          id: 1,
          name: 'Rocket Whale',
          players: [{
            name: 'Sam'
          },{
            name: 'Tom'
          }]
        });
      });

      it('should encode', function() {
        expect(team.players).to.be.a(Backbone.Collection);
        expect(team.players.length).to.be(2);
      });

      it('should decode', function() {
        var teamJson = team.toJSON();
        expect(teamJson).to.eql({
          id: 1,
          name: 'Rocket Whale',
          player_attributes: [{
            name: 'Sam'
          },{
            name: 'Tom'
          }]
        });

        var playerJson = team.players.first().toJSON();
        expect(playerJson).to.eql({
          team_id: 1,
          name: 'Sam'
        });
      });
    });

    describe('belongs To', function() {
      var player;

      beforeEach(function() {
        player = new Player({
          name: 'Sam',
          team: {
            id: 1,
            name: 'Rocket Whale'
          }
        })
      });

      it('should encode', function() {
        var team = player.team;
        expect(team).to.be.a(Backbone.Model);
        expect(team.players.length).to.be(1);
      });

      it('should decode', function() {
        var playerJson = player.toJSON();
        expect(playerJson).to.eql({
          team_id: 1,
          name: 'Sam'
        });
      });

      it('should change owners', function() {
        var originalTeam = player.team;
        var newTeam = new Team();
        player.team = newTeam;

        expect(player.team).to.be(newTeam);
        expect(originalTeam.players.length).to.be(0);
        expect(newTeam.players.length).to.be(1);
      });
    });
  });
});