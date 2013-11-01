describe('Model Query Parameters', function () {
  'use strict';

  beforeEach(module('robbyronk.model-sync'));

  var Model, $rootScope, $httpBackend;
  beforeEach(inject(function (_Model_, _$rootScope_, _$httpBackend_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    Model = _Model_;
  }));

  afterEach(function () {
    $rootScope.$digest();
    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('partial response', function () {
    beforeEach(function () {
      $httpBackend.expectGET('/people?fields=age,name').respond(200, {name: 'Arnold', age: 25});
    });

    it('should handle partial response query', function () {
      Model.query()
        .fields('name', 'age')
        .get('/people')
        .then(function (data) {
          expect(data).toBeDefined();
        });
    });

    it('should remove duplicates from partial response query', function () {
      Model.query()
        .fields('name', 'age', 'name', 'age')
        .get('/people')
        .then(function (data) {
          expect(data).toBeDefined();
        });
    });
  });

  describe('sorting query', function () {
    beforeEach(function () {
      $httpBackend.expectGET('/people?sort=name,age').respond(200, {name: 'Arnold', age: 25});
    });

    it('should handle sorting query', function () {
      Model.query()
        .sort('name', 'age')
        .get('/people')
        .then(function (data) {
          expect(data).toBeDefined();
        });
    });

    it('should remove duplicates from sorting query', function () {
      Model.query()
        .sort('name', 'age', '-age')
        .get('/people')
        .then(function (data) {
          expect(data).toBeDefined();
        });
    });

    it('should remove unprefixed duplicates from sorting query', function () {
      Model.query()
        .sort('name', 'age', 'age')
        .get('/people')
        .then(function (data) {
          expect(data).toBeDefined();
        });
    });
  });

  it('should limit query', function () {
    $httpBackend.expectGET('/people?limit=10').respond(200, {name: 'Arnold', age: 25});
    Model.query()
      .limit(10)
      .get('/people')
      .then(function (data) {
        expect(data).toBeDefined();
      });
  });

  it('should offset query', function () {
    $httpBackend.expectGET('/people?offset=10').respond(200, {name: 'Arnold', age: 25});
    Model.query()
      .offset(10)
      .get('/people')
      .then(function (data) {
        expect(data).toBeDefined();
      });
  });

  it('should handle partial response with sorting', function () {
    $httpBackend.expectGET('/people?fields=name&sort=age').respond(200, {name: 'Arnold', age: 25});
    Model.query()
      .fields('name')
      .sort('age')
      .get('/people')
      .then(function (data) {
        expect(data).toBeDefined();
      });
  });

  it('should handle filtering', function () {
    $httpBackend.expectGET('/people?filter=gt(a,5)').respond(200, {name: 'Arnold', age: 25});
    var p = Model.query().predicates;
    Model.query()
      .filter(p.gt('a', 5))
      .get('/people')
      .then(function (data) {
        expect(data).toBeDefined();
      });
  });

  it('should handle more complex filtering', function () {
    $httpBackend.expectGET('/people?filter=and(gt(a,5),lt(a,15))').respond(200, {name: 'Arnold', age: 25});
    var p = Model.query().predicates,
      gt = p.gt,
      lt = p.lt,
      and = p.and;
    Model.query()
      .filter(and(gt('a', 5), lt('a', 15)))
      .get('/people')
      .then(function (data) {
        expect(data).toBeDefined();
      });
  });


});