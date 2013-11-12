require('./examples');
var expect = require('expect.js'),
    Backbone = require('../backbone-relationships.js');

describe('Backbone.Model', function() {
  describe('codec', function(){
    describe('dates', function(){
      var team;

      beforeEach(function() {
        team = new Team({
          created_at: '2012-12-17T13:30:59-08:00'
        }, {
          parse: true
        });
      });

      it('should encode', function(){
        expect(team.created_at).to.be.a(Date);
        expect(team.created_at).to.eql(new Date(2012, 11, 17, 13, 30, 59));
      });

      it('should decode', function(){
        var json = team.toJSON();
        expect(json.created_at).to.eql('2012-12-17T18:30:59.000Z');
      });
    });
  });

  describe('embedded', function() {
    describe('model', function() {
      var team;

      beforeEach(function() {
        team = new Team({
          logo: {
            url: '/images/image.gif'
          }
        }, {
          parse: true
        });
      });

      it('should encode', function() {
        expect(team.logo.url).to.be('/images/image.gif');
        expect(team.logo.getUrl()).to.be('/images/image.gif');
      });

      it('should decode', function() {
        var json = team.toJSON();
        expect(json).to.eql({
          logo: {
            url: '/images/image.gif'
          }
        });
      });
    });

    describe('collection', function() {
      var team;

      beforeEach(function() {
        team = new Team({
          images: [{
            url: '/images/image.gif'
          }]
        }, {
          parse: true
        });
      });

      it('should encode', function() {
        expect(team.images.length).to.be(1);
        expect(team.images.models[0].url).to.be('/images/image.gif');
        expect(team.images.models[0].getUrl()).to.be('/images/image.gif');
      });

      it('should decode', function() {
        var json = team.toJSON();
        expect(json).to.eql({
          images: [{
            url: '/images/image.gif'
          }]
        });
      });

      it('should track adds', function() {
        team.images.add({
          url: '/images/image.jpg'
        });

        var json = team.toJSON();
        expect(json).to.eql({
          images: [{
            url: '/images/image.gif'
          }, {
            url: '/images/image.jpg'
          }]
        });
      });

      it('should track removes', function() {
        var image = team.images.models[0];
        team.images.remove(image);

        var json = team.toJSON();
        expect(json).to.eql({
          images: []
        });
      });

      it('should track changes', function() {
        var image = team.images.models[0];
        image.url = '/images/image.tiff'

        var json = team.toJSON();
        expect(json).to.eql({
          images: [{
            url: '/images/image.tiff'
          }]
        });
      });
    });    
  });
});