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
      var selecting, sortedBy, limitTo, offsetBy;
      return {
        fields: function (/* fields */) {
          selecting = Array.prototype.slice.call(arguments);
          // TODO sort and uniq
          return this;
        },
        sort: function (/* fields */) {
          sortedBy = Array.prototype.slice.call(arguments);
          // TODO uniq
          return this;
        },
        limit: function (int) {
          limitTo = parseInt(int, 10);
          return this;
        },
        offset: function (int) {
          offsetBy = parseInt(int, 10);
          return this;
        },
        get: function (path) {
          var queryParts = [
            (selecting ? 'fields=' + selecting.join(',') : ''),
            (sortedBy ? 'sort=' + sortedBy.join(',') : ''),
            limitTo ? 'limit=' + limitTo : '',
            offsetBy ? 'offset=' + offsetBy : ''
          ];
          var queryString = '?' + _.remove(queryParts).join('&');
          return $http.get(path + queryString).then(function (response) {
            return response.data;
          })
        }
      }
    };
  });