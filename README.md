angular-model-sync
==================

Synchronize updates to your model in one scope with your API and the rest of the scopes in your app

You'll need a RESTful API or a shim made of $http interceptors to use this service.

Getting Started
==================

Run `bower install angular-model-sync` or copy modelSync.js to your JS folder.

Include the `robbyronk.model-sync` module in your app.

Example Usages
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
