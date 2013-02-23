require('./examples');
var expect = require('expect.js'),
    Backbone = require('../backbone-relations.js');

describe('Backbone.Model', function() {
  describe('codec', function(){
    describe('dates', function(){
      var team;

      beforeEach(function() {
        team = new Team({
          created_at: '2012-12-17T13:30:59-08:00'
        });
      });

      it('should encode', function(){
        expect(team.get('created_at')).to.be.a(Date);
        expect(team.get('created_at')).to.eql(new Date(2012, 11, 17, 13, 30, 59));
      });

      it('should decode', function(){
        var json = team.toJSON();
        expect(json.created_at).to.eql('2012-12-17T18:30:59.000Z');
      });
    });
  });
});