'use strict';

angular.module('robbyronk.model-sync', [])
  .service('Model', function Model($cacheFactory, $rootScope, $http, $q) {
    var cache = $cacheFactory('cache');

    var thisModel = this;

    this.create = function (path, object) {
      return $http.post(path, object).then(function (response) {
        var createdObjectPath = response.headers('Location');
        var createdObject = response.data;

        cache.put(createdObjectPath, createdObject);

        if (cache.get(path)) {
          thisModel.get(path).then(function (parentCollection) {
            parentCollection.push(createdObject);
            cache.put(path, parentCollection);
            $rootScope.$broadcast(path, parentCollection);
          });
        }

        var suffix = /\/$/.exec(path) ? 'new' : '/new';
        $rootScope.$broadcast(path + suffix, createdObject);

        return angular.copy(createdObject);
      });
    };

    this.get = function (path) {
      if (cache.get(path)) {
        return $q.when(angular.copy(cache.get(path)));
      } else {
        return $http.get(path).then(function (response) {
          cache.put(path, response.data);
          return angular.copy(response.data);
        });
      }
    };

    this.delete = function (path) {
      $http.delete(path).then(function () {
        cache.remove(path);
        $rootScope.$broadcast(path);

        var match = /\/?(.*\/)(.+)$/.exec(path);
        var parentPath = match[1];
        var removedObjectId = match[2];

        if (cache.get(parentPath)) {
          thisModel.get(parentPath).then(function (oldParentCollection) {
            var parentCollection = _.reject(oldParentCollection, { id: removedObjectId });
            cache.put(parentPath, parentCollection);
            $rootScope.$broadcast(parentPath, parentCollection);
          });
        }
      });
    };

    this.subscribe = function (scope, name, path) {
      scope.$watch(name, function (object) {
        if (angular.isDefined(object)) {
          var cb = function () {
            cache.put(path, angular.copy(object));
            $rootScope.$broadcast(path, object, scope.$id);
          };
          thisModel.update(path, object, cb);
        }
      }, true);

      scope.$on(path, function (event, object, originScopeId) {
        if (scope.$id !== originScopeId) {
          scope[name] = angular.copy(object);
        }
      });

      thisModel.get(path).then(function (object) {
        scope[name] = angular.copy(object);
      });
    };

    this.update = function (path, object, cb) {
      var callback = cb || function () {
        cache.put(path, angular.copy(object));
        $rootScope.$broadcast(path, object);
      };
      if (angular.equals(object, cache.get(path))) {
        // do nothing
      } else {
        $http.put(path, object).then(callback);
      }
    };

    this.query = function () {
      var withoutPrefix = function (value) {
        if (_.contains(['-', '+'], value[0])) {
          return value.substr(1);
        }
        return value;
      };
      var generatePredicate = function (name, arity) {
        return function () {
          if (arity && arguments.length !== arity) {
            throw new Error('Expected ' + arity + ' arguments, got ' + arguments.length);
          }
          return name + '(' + _.toArray(arguments).join(',') + ')';
        };
      };
      var predicates = {};
      angular.forEach(['and', 'or', 'in', 'nin'], function (name) {
        predicates[name] = generatePredicate(name);
      });
      angular.forEach(['gt', 'lt', 'gte', 'lte', 'eq', 'neq'], function (name) {
        predicates[name] = generatePredicate(name, 2);
      });
      predicates.not = generatePredicate('not', 1);

      var selecting, sortedBy, limitTo, offsetBy, filterBy;
      return {
        fields: function (/* fields */) {
          selecting = _.uniq(arguments).sort();
          return this;
        },
        sort: function (/* fields */) {
          sortedBy = _.filter(arguments, function (field, index, fields) {
            return index === _.findIndex(fields, function (otherField) {
              return field === otherField || withoutPrefix(field) === withoutPrefix(otherField);
            });
          });
          return this;
        },
        limit: function (integer) {
          limitTo = parseInt(integer, 10);
          return this;
        },
        offset: function (integer) {
          offsetBy = parseInt(integer, 10);
          return this;
        },
        predicates: predicates,
        filter: function (predicate) {
          filterBy = predicate;
          return this;
        },
        get: function (path) {
          var queryParts = [
            selecting ? 'fields=' + selecting.join(',') : '',
            filterBy ? 'filter=' + filterBy : '',
            limitTo ? 'limit=' + limitTo : '',
            offsetBy ? 'offset=' + offsetBy : '',
            sortedBy ? 'sort=' + sortedBy.join(',') : ''
          ];
          var queryString = '?' + _.remove(queryParts).join('&');
          return $http.get(path + queryString).then(function (response) {
            return response.data;
          })
        }
      }
    };
  });