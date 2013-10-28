/* jshint camelcase: false */
/* global describe: false, expect: false, it: false, inject: false, beforeEach: false */

describe('Service: Model', function () {
  'use strict';

  beforeEach(module('robbyronk.model-sync'));

  var Model, $rootScope, $httpBackend;
  beforeEach(inject(function (_Model_, _$rootScope_, _$httpBackend_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    Model = _Model_;

    $httpBackend.expectGET(/items\/$/).respond(200, [ { name: 'Tester', id: '456' } ]);
    Model.get('items/');
    $rootScope.$digest();
    $httpBackend.flush();
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('repeated calls to `get` should use cache', function () {
    Model.get('items/');
  });

  it('`create` should update parent collection', function () {
    $httpBackend.expectPOST(/items\/$/).respond(201, {
      name: 'Test',
      id: '123'
    });
    Model.create('items/', { name: 'Test' });
    $rootScope.$digest();
    $httpBackend.flush();

    var items;
    Model.get('items/').then(function (a) {
      items = a;
    });
    $rootScope.$digest();

    expect(items.length).toBe(2);
  });

  it('`delete` should update parent collection', function () {
    $httpBackend.expectDELETE(/items\/456$/).respond(204);
    Model.delete('items/456');
    $rootScope.$digest();
    $httpBackend.flush();

    var items;
    Model.get('items/').then(function (a) {
      items = a;
    });
    $rootScope.$digest();

    expect(items.length).toBe(0);
  });


});
