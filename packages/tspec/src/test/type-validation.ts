/**
 * Type validation test - this file should compile without errors
 * to ensure all type definitions work correctly
 */

import { createClient, Tspec } from '../index';
import type { 
  ExtractPathParams, 
  ClientResponse, 
  Client,
  RequestOptions 
} from '../types/client';

// Test API Spec
interface User {
  id: number;
  name: string;
  email: string;
}

type TestApiSpec = Tspec.DefineApiSpec<{
  paths: {
    '/users/{id}': {
      get: {
        path: { id: number };
        responses: {
          200: User;
          404: { message: string };
        };
      };
      put: {
        path: { id: number };
        body: Partial<User>;
        responses: {
          200: User;
          400: { errors: string[] };
        };
      };
    };
    '/users': {
      get: {
        query: { page: number; limit: number };
        header: { 'Authorization': string };
        cookie: { sessionId: string };
        responses: {
          200: User[];
        };
      };
      post: {
        body: Omit<User, 'id'>;
        responses: {
          201: User;
          400: { errors: string[] };
        };
      };
    };
  };
}>;

// Type tests
type _Test1 = ExtractPathParams<'/users/{id}'>; // Should be { id: string | number }
type _Test2 = ExtractPathParams<'/users/{userId}/posts/{postId}'>; // Should have both params
type _Test3 = ExtractPathParams<'/users'>; // Should be {}

// Client creation
const client: Client<TestApiSpec> = createClient<TestApiSpec>({
  baseUrl: 'https://api.example.com',
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});

// Ensure methods exist
const _methodsExist: Record<Tspec.HttpMethod, Function> = {
  get: client.get,
  post: client.post,
  put: client.put,
  patch: client.patch,
  delete: client.delete,
  options: client.options,
  head: client.head,
};

// Test that types are properly inferred
async function testTypeSafety() {
  // GET request with path params
  const getUserResult = await client.get('/users/{id}', {
    params: { id: 1 },
  });

  // Status-based type narrowing
  if (getUserResult.status === 200) {
    const user: User = getUserResult.body;
    const _name: string = user.name;
  } else if (getUserResult.status === 404) {
    const error: { message: string } = getUserResult.body;
    const _message: string = error.message;
  }

  // GET request with query, headers, and cookies
  const listUsersResult = await client.get('/users', {
    query: { page: 1, limit: 10 },
    headers: { 'Authorization': 'Bearer token' },
    cookies: { sessionId: 'abc123' },
  });

  if (listUsersResult.status === 200) {
    const users: User[] = listUsersResult.body;
    const _firstUser: User = users[0];
  }

  // POST request with body
  const createUserResult = await client.post('/users', {
    body: { name: 'John', email: 'john@example.com' },
  });

  if (createUserResult.status === 201) {
    const newUser: User = createUserResult.body;
    const _id: number = newUser.id;
  } else if (createUserResult.status === 400) {
    const error: { errors: string[] } = createUserResult.body;
    const _errors: string[] = error.errors;
  }

  // PUT request with path params and body
  const updateUserResult = await client.put('/users/{id}', {
    params: { id: 1 },
    body: { name: 'Jane' },
  });

  if (updateUserResult.status === 200) {
    const updatedUser: User = updateUserResult.body;
    const _updatedName: string = updatedUser.name;
  }
}

console.log('Type validation passed!');
