# Users API

This API provides self-management capabilities for users as well as admin-only user management capabilities.

## User Object

Information about a user.

objectSummary({name: 'User'})

## Get Self

Fetch the user object for the user associated with the JWT token.

callSummary({method: 'GET', path: '/1/users/me'})

## Update Self

Update the user object for the user associated with the JWT token.

callSummary({method: 'PATCH', path: '/1/users/me'})

## Create User

Create a new user object. Requires admin permissions.

callSummary({method: 'POST', path: '/1/users'})

## List and Search Users

List users and filter by certain attributes. Requires admin permissions.

callSummary({method: 'POST', path: '/1/users/search'})

## Get User

Obtain user object by unique user ID. Requires admin permissions.

callSummary({method: 'GET', path: '/1/users/:userId'})

## Update User

Update user information by ID. Requires admin permissions.

callSummary({method: 'PATCH', path: '/1/users/:userId'})

## Delete User

Delete user by ID. Requires admin permissions.

callSummary({method: 'DELETE', path: '/1/users/:userId'})
