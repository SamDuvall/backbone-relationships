var expect = require('expect.js'),
    Backbone = require('../backbone-relations.js');

var Model = Backbone.Model.extend({
  fields: [
    {name: 'created_at', codec: Date}
  ]
});

describe('Backbone.Model', function(){
  it('Should encode fields', function(){
    var model = new Model({
      created_at: '2012-12-17T13:30:59-08:00'
    });

    expect(model.get('created_at')).to.be.a(Date);
    expect(model.get('created_at')).to.eql(new Date(2012, 11, 17, 13, 30, 59));

    expect(model.toJSON().created_at).to.eql('2012-12-17T18:30:59.000Z');
  });
});