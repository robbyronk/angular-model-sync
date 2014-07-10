'use strict';

angular.module('robbyronk.model-sync.modelQuery', [])
  .factory('modelQuery', function ($http) {
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
      query: function () {
        selecting = [];
        sortedBy = [];
        limitTo = '';
        offsetBy = '';
        filterBy = '';
        return this;
      },
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
  });