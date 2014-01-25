'use strict';

describe('Restmod collection:', function() {

  var $httpBackend, $restmod, Bike;

  beforeEach(module('plRestmod'));

  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $restmod = $injector.get('$restmod');
    Bike = $restmod.model('/api/bikes');
  }));

  describe('', function() {

    var query;

    beforeEach(function() {
      query = Bike.$collection({ brand: 'trek' });
      $httpBackend.when('GET', '/api/bikes?brand=trek').respond([ { model: 'Slash' }, { model: 'Remedy' } ]);
      $httpBackend.when('GET', '/api/bikes?brand=giant').respond([ { model: 'Reign' } ]);
    });

    describe('$collection', function() {
      // TODO.
    });

    describe('$search', function() {

      it('should retrieve a collection of items of same type', function() {
        var bikes = query.$search({ brand: 'giant' });
        expect(bikes.length).toEqual(0);
        expect(bikes.$resolved).toBeFalsy();
        $httpBackend.flush();
        expect(bikes.length).toEqual(1);
        expect(bikes.$resolved).toBeTruthy();
        expect(bikes[0] instanceof Bike).toBeTruthy();
      });

    });

    describe('$fetch', function() {

      it('should retrieve a collection of items of same type', function() {
        expect(query.$pending).toBe(false);
        query.$fetch();
        expect(query.$pending).toBe(true);
        expect(query.length).toEqual(0);
        expect(query.$resolved).toBe(false);
        $httpBackend.flush();
        expect(query.length).toEqual(2);
        expect(query.$resolved).toBe(true);
        expect(query[0] instanceof Bike).toBeTruthy();
      });

      it('should append new items if called again', function() {
        query = query.$fetch();
        $httpBackend.flush();
        expect(query.$resolved).toBe(true);
        expect(query.length).toEqual(2);
        query.$fetch({ brand: 'giant' });
        $httpBackend.flush();
        expect(query.length).toEqual(3);
      });

    });

    describe('$reset', function() {

      it('should make the next call to $fetch clear old items', function() {
        query.$fetch();
        $httpBackend.flush();
        expect(query.length).toEqual(2);
        query.$reset().$fetch({ brand: 'giant' });
        $httpBackend.flush();
        expect(query.length).toEqual(1);
      });

    });

    describe('$refresh', function() {

      it('should clear old items on resolve', function() {
        query.$fetch();
        $httpBackend.flush();
        expect(query.length).toEqual(2);
        query.$refresh({ brand: 'giant' });
        $httpBackend.flush();
        expect(query.length).toEqual(1);
      });

    });

  });

  describe('$build', function() {
    it('should initialize model with given object properties', function() {
      var bike = Bike.$build({ model: 'Teocali' });
      expect(bike.model).toEqual('Teocali');
    });
  });

  describe('$new', function() {
    it('should initialize model with given primary key', function() {
      var bike = Bike.$new(20);
      expect(bike.$pk).toEqual(20);
    });
  });

  describe('$create', function() {

    it('should build and save', function() {
      Bike.$create({ model: 'Teocali' });
      $httpBackend.expectPOST('/api/bikes', { model: 'Teocali' }).respond(200, '{ "id": 1 }');
      $httpBackend.flush();
    });

    it('should allow an empty response', function() {
      Bike.$create({ model: 'Teocali' });

      $httpBackend.expectPOST('/api/bikes', { model: 'Teocali' }).respond(200, '');
      $httpBackend.flush();
    });

    it('should assign an ID to the new resource', function() {
      var bike = Bike.$create({ model: 'Teocali' });
      expect(bike.id).toBeUndefined();

      $httpBackend.expectPOST('/api/bikes', { model: 'Teocali' }).respond(200, '{ "id": 1 }');
      $httpBackend.flush();
      expect(bike.id).toEqual(1);
    });

    it('should bind to the new resource', function() {
      var bike = Bike.$create({ model: 'Teocali' });

      $httpBackend.expectPOST('/api/bikes', { model: 'Teocali' }).respond(200, '{ "id": 1 }');
      $httpBackend.flush();
      expect(bike.$url()).toEqual('/api/bikes/1');
    });

  });

  describe('$on', function() {

    it('should register a callback at collection level', function() {
      var col = Bike.$collection(),
          spy = jasmine.createSpy('callback');

      col.$on('poke', spy);
      Bike.$callback('poke');
      expect(spy).not.toHaveBeenCalled();

      col.$callback('poke');
      expect(spy).toHaveBeenCalled();
    });

  });

  describe('$add', function() {

    it('should add a new object to the back of the array and trigger after-add', function() {
      var col = Bike.$collection(),
          spy = jasmine.createSpy('callback');

      col.$on('after-add', spy);
      col.$add(Bike.$build());

      expect(col.length).toEqual(1);
      expect(spy).toHaveBeenCalled();
    });

    it('should add a new object to the specified index if index is provided', function() {
      var col = Bike.$collection(),
          obj = Bike.$build();

      col.$add(Bike.$build());
      col.$add(Bike.$build());
      col.$add(Bike.$build());
      col.$add(obj, 1);

      expect(col[1]).toEqual(obj);
    });
  });

  describe('$remove', function() {

    it('should remove an object if already in the array and triger after-remove', function() {
      var col = Bike.$collection(),
          obj = Bike.$build(),
          spy = jasmine.createSpy('callback');

      col.$on('after-remove', spy);
      col.$add(Bike.$build());
      col.$add(obj);
      col.$add(Bike.$build());
      col.$remove(obj);

      expect(col.length).toEqual(2);
      expect(spy).toHaveBeenCalled();
    });

  });

  describe('$indexOf', function() {

    it('should return index if object found', function() {
      var col = Bike.$collection(),
          obj = Bike.$build();

      col.$add(Bike.$build());
      col.$add(obj);
      col.$add(Bike.$build());

      expect(col.$indexOf(obj)).toEqual(1);
    });

    it('should return -1 if object not found', function() {
      var col = Bike.$collection(),
          obj = Bike.$build();

      col.$add(Bike.$build());
      col.$add(Bike.$build());

      expect(col.$indexOf(obj)).toEqual(-1);
    });


    it('should return index if object found when searching using a function', function() {
      var col = Bike.$collection(),
          obj = Bike.$build({ brand: 'Giant' });

      col.$add(Bike.$build());
      col.$add(obj);
      col.$add(Bike.$build());

      expect(col.$indexOf(function(_obj) {
        return _obj.brand == 'Giant';
      })).toEqual(1);
    });

  });

});

