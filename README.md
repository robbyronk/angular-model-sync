angular-model-sync
==================

Synchronize updates to your model in one scope with your API and the rest of the scopes in your app

You'll need a RESTful API or a shim made of $http interceptors to use this service.

Getting Started
==================

Run `bower install angular-model-sync` or copy modelSync.js to your JS folder.

Include the `robbyronk.model-sync` module in your app.

Example Use Cases
==================

Keep a count of shopping cart items up to date in the header.

Update the name of a document in a project file tree from a rename dialog.

Update a username in the header from a user profile form in the main page.

Using angular-model-sync
===================
## Creating a new object
### `create(path, object)`
- path - RESTful path
- object - object to create

Returns created object.

This function will `POST` object to `path`. The created object is returned from the server
and stored in the cache.

#### Example
`create('/users/', { name: 'jsmith' })`

## Read an object
### `get(path)`
- path - RESTful path

Returns promise.

If the object is in the cache, the object wrapped in a promise is returned.
If the object is not in the cache, a `GET` is issued to the server and the object wrapped in a promise is returned.

#### Example
`get('/users/')`

`get('/users/123')`

## Delete an object
### `delete(path)`
- path - RESTful path

Returns nothing.

A `DELETE` is issued to the server and the object is removed, if present, from the cache.
A broadcast for the collection containing the object is sent to all scopes to remove the object across the app.

#### Example
`delete('/users/123')`

## Update an object
### `update(path, object)`
- path - RESTful path
- object - object to update with

Returns nothing.

A `PUT` is issued to the server. If the request to the server is successful, the object is updated in the cache and across
the app.

#### Example
`update('/users/123', { name: 'ksmith' })`

## Update an object automatically
### `subscribe(localScope, localName, path)`
- localScope - the scope in which to subscribe
- localName - name of the variable in the scope to update to and from
- path - RESTful path

Returns nothing.

Watches the variable in scope. When changes are made to the variable, the changes are propagated to the server via `PUT`
request. If the request is successful, the changes are broadcast to the rest of the app. A event listener is also set up 
to listen for changes to this path and update the local variable. This function is the magic of angular-model-sync.

#### Example
`subscribe(scope, 'user', '/users/123')`

======================

# ModelQuery: Querying with Parameters
The `modelQuery` factory creates an object to be used to query a server to find
a set of objects that match conditions, return selected fields, sort objects and
paginate objects.

## Using modelQuery
ModelQuery is a fluent API with 5 configuration functions and a `get()` function
to make an HTTP request using the prior configuration. The configuration functions
are named for the query parameters that they set up. See below for a complete example.

```javascript
var p = modelQuery.predicates;
modelQuery.fields('name','age')
  .sort('height')
  .limit(10)
  .offset(20)
  .filter(p.eq('registered',true))
  .get('/users')
  .then(function (users) {
    // do stuff with users
  });
```

## Partial Response
The `fields` function takes any number of strings as arguments. The `fields` query
parameter will be the arguments of the `fields` function, separated by commas.

```javascript
modelQuery.fields('name', 'age', 'address.state')
  .get('/users')
```
will make an HTTP request to:
```
GET /users?fields=address.state,age,name
```

## Sorting
The `sort` function takes any number of strings as arguments. The arguments can
be prefixed with `-` or `+` to indicate to the server descending or ascending
order, respectively. The `sort` query parameter will be the arguments of the `sort`
function, separated by commas.

```javascript
modelQuery.sort('address.state','address.city')
  .get('/users')
```
will make an HTTP request to:
```
GET /users?sort=address.state,address.city
```

## Pagination
Pagination has two parameters, `limit` and `offset`. These two functions both take
an integer that will be the value of the query parameter of the same name.

```javascript
modelQuery.limit(5)
  .offset(25)
  .get('/users')
```
will make an HTTP request to:
```
GET /users?limit=5&offset=25
```

## Filtering
Filtering is similar to the where clause of a SQL statement in that only objects
that pass the specified conditions are returned.
The filter function takes a string that represents a predicate. The developer is not
expected to make this string themselves though but is instead expected to use and extend the
predicates provided in the `predicates` object.

### Predicates
#### lt (less than)
#### lte (less than)
#### gt (greater than)
#### gte (less than)
`lt`, `lte`, `gt` and `gte` take two arguments. The first is a property of the object that you are querying.
The second is a number or another property of the object that you are querying.

```javascript
predicate = modelQuery.predicates.gt('age', 55)
modelQuery.filter(predicate).get('/users')
```
will make an HTTP request to:
```
GET /users?filter=gt(age,55)
```

#### eq (equal)
#### neq (not equal)
`eq` and `neq` take two arguments. The first is a property of the object that you are querying.
The second is a number, boolean, string or another property. Strings must be quoted.

```javascript
predicate = modelQuery.predicates.eq('registered', true)
modelQuery.filter(predicate).get('/users')
```
will make an HTTP request to:
```
GET /users?filter=eq(registered,true)
```

#### and
`and` takes any number of predicate arguments.

#### or
`or` takes any number of predicate arguments.

#### not
`not` takes a single predicate argument.

```javascript
p = modelQuery.predicates
predicate = p.and(
  p.eq('registered', true),
  p.gt('age', 55)
)
modelQuery.filter(predicate).get('/users')
```
will make an HTTP request to:
```
GET /users?filter=and(eq(registered,true),gt(age,55))
```
