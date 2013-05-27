require('./examples');
var expect = require('expect.js'),
    Backbone = require('../backbone-relationships.js');

describe('Backbone.Collection.Subset', function() {
  var team1;
  var team2;
  var filter;
  var collection;
  var subset;

  function filter(team) {
    return team === team1;
  }

  beforeEach(function() {
    team1 = new Team({
      name: 'Team 1'
    });

    team2 = new Team({
      name: 'Team 2'
    });
    
  });

  it('filters on create', function() {
    collection = new Backbone.Collection([team1, team2]);
    subset = collection.subset(filter);
    expect(subset.models).to.eql([team1]);
  });

  it('can be iterated on', function() {
    collection = new Backbone.Collection([team1, team2]);
    subset = collection.subset(filter);

    var count = 0;
    var names = subset.each(function(team) {
      count = count + 1;
    }, this);
    expect(count).to.be(1);
  });

  describe('resets', function() {
    beforeEach(function() {
      collection = new Backbone.Collection();
      subset = collection.subset(filter);
    });

    it('passes filter', function() {
      collection.reset([team1, team2]);
      expect(subset.models).to.eql([team1]);
    });
  });

  describe('add', function() {
    beforeEach(function() {
      collection = new Backbone.Collection();
      subset = collection.subset(filter);
    });

    it('passes filter', function() {
      collection.add(team1);
      expect(subset.models).to.eql([team1]);
    });

    it('fails filter', function() {
      collection.add(team2);
      expect(subset.models).to.eql([]);
    });
  });

  describe('remove', function() {
    beforeEach(function() {
      collection = new Backbone.Collection([team1, team2]);
      subset = collection.subset(filter);
    });

    it('passes filter', function() {
      collection.remove(team1);
      expect(subset.models).to.eql([]);
    });

    it('fails filter', function() {
      collection.remove(team2);
      expect(subset.models).to.eql([team1]);
    });
  });

  describe('filter', function() {
    function filter2(team) {
      return team === team2;
    }

    beforeEach(function() {
      collection = new Backbone.Collection([team1, team2]);
      subset = collection.subset(filter);
    });

    it('passes filter', function() {
      subset.setFilter(filter2);
      expect(subset.models).to.eql([team2]);
    });
  });
});