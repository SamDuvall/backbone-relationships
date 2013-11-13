require('./examples');
var expect = require('expect.js'),
    Backbone = require('../backbone-relationships.js');

describe('Backbone.Model', function() {
  describe('schema', function(){
    describe('dates', function(){
      var team;

      beforeEach(function() {
        team = new Team({
          created_at: '2012-12-17T13:30:59-08:00'
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
          id: 1,
          logo: {
            ref: '/images/image.gif'
          }
        });
      });

      it('should get its parent', function() {
        expect(team.logo.parent).to.be(team);
      });

      it('should get its root', function() {
        expect(team.logo.root).to.be(team);
      });

      it('should have a URL', function() {
        expect(team.logo.url()).to.be('/teams/1/logo');
      });

      it('should encode', function() {
        expect(team.logo.ref).to.be('/images/image.gif');
        expect(team.logo.getPath()).to.be('/images/image.gif');
      });

      it('should decode', function() {
        var json = team.toJSON();
        expect(json).to.eql({
          id: 1,
          logo: {
            ref: '/images/image.gif'
          }
        });
      });
    });

    describe('collection', function() {
      var team;

      beforeEach(function() {
        team = new Team({
          images: [{
            ref: '/images/image.gif'
          }]
        });
      });

      it('should get its parent', function() {
        expect(team.images.parent).to.be(team);
        expect(team.images.first().parent).to.be(team);
      });

      it('should get its root', function() {
        expect(team.images.root).to.be(team);
        expect(team.images.first().root).to.be(team);
      });

      it('should encode', function() {
        expect(team.images.length).to.be(1);
        expect(team.images.models[0].ref).to.be('/images/image.gif');
        expect(team.images.models[0].getPath()).to.be('/images/image.gif');
      });

      it('should decode', function() {
        var json = team.toJSON();
        expect(json).to.eql({
          images: [{
            ref: '/images/image.gif'
          }]
        });
      });

      describe('add', function() {
        it('should decode', function() {
          team.images.add({
            ref: '/images/image.jpg'
          });

          var json = team.toJSON();
          expect(json).to.eql({
            images: [{
              ref: '/images/image.gif'
            }, {
              ref: '/images/image.jpg'
            }]
          });
        });

        it('should fire a mutate event', function(done) {
          team.on('mutate:add', function(model, collection) {
            expect(model).to.be(team.images.last());
            expect(collection).to.be(team.images);
          });

          team.on('mutate', function(type, model, collection) {
            expect(type).to.be('add');
            expect(model).to.be(team.images.last());
            expect(collection).to.be(team.images);
            done();
          });

          team.images.add({
            ref: '/images/image.jpg'
          });
        });
      });

      describe('remove', function() {
        it('should decode', function() {
          var image = team.images.models[0];
          team.images.remove(image);

          var json = team.toJSON();
          expect(json).to.eql({
            images: []
          });
        });

        it('should fire a mutate event', function(done) {
          var image = team.images.models[0];

          team.on('mutate:remove', function(model, collection) {
            expect(model).to.be(image);
            expect(collection).to.be(team.images);
          });

          team.on('mutate', function(type, model, collection) {
            expect(type).to.be('remove');
            expect(model).to.be(image);
            expect(collection).to.be(team.images);
            done();
          });

          team.images.remove(image);
        });
      });

      describe('change', function() {
        it('should decode', function() {
          var image = team.images.models[0];
          image.ref = '/images/image.tiff'

          var json = team.toJSON();
          expect(json).to.eql({
            images: [{
              ref: '/images/image.tiff'
            }]
          });
        });

        it('should fire a mutate event', function(done) {
          var image = team.images.models[0];

          team.on('mutate:change', function(model, changes) {
            expect(model).to.be(image);
            expect(changes).to.eql({
              ref: '/images/image.tiff'
            });
          });

          team.on('mutate', function(type, model, changes) {
            expect(type).to.be('change');
            expect(model).to.be(image);
            expect(changes).to.eql({
              ref: '/images/image.tiff'
            });
            done();
          });

          image.ref = '/images/image.tiff'
        });
      });

      describe('move', function() {
        beforeEach(function() {
          team = new Team({
            images: [{
              ref: '/images/image-1.gif'
            }, {
              ref: '/images/image-2.gif'
            }]
          });
        });

        it('should decode', function() {
          var image = team.images.first();
          image.move(1);

          var json = team.toJSON();
          expect(json).to.eql({
            images: [{
              ref: '/images/image-2.gif'
            }, {
              ref: '/images/image-1.gif'
            }]
          });
        });

        it('should fire events', function(done) {
          var image = team.images.first();

          team.on('mutate:move', function(model, index, collection) {
            expect(model).to.be(image);
            expect(index).to.be(1);
            expect(collection).to.be(team.images);
          });

          team.on('mutate', function(type, model, index, collection) {
            expect(type).to.be('move');
            expect(model).to.be(image);
            expect(index).to.be(1);
            expect(collection).to.be(team.images);
            done();
          });

          image.move(1);
        });
      });
    });
  });
});