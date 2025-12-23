# Typed Client Example

This example demonstrates how to use tspec's typed client layer to make type-safe API calls.

## Features

- **Full Type Safety**: The client infers types from your API specification
- **Path Parameters**: Automatically typed and substituted in URLs
- **Response Types**: Discriminated union types based on status codes
- **Query Parameters**: Fully typed query string support
- **Request Body**: Type-safe request body validation

## Usage

### 1. Define your API specification (server.ts)

```typescript
import { Tspec } from 'tspec';

interface Author {
  id: number;
  name: string;
}

export type AuthorApiSpec = Tspec.DefineApiSpec<{
  paths: {
    '/authors/{id}': {
      get: {
        summary: 'Get author by id',
        path: { id: number },
        responses: { 
          200: Author,
          404: { message: string },
        },
      },
    },
  }
}>;
```

### 2. Create a typed client (client.ts)

```typescript
import { createClient } from 'tspec';
import { AuthorApiSpec } from './server';

const client = createClient<AuthorApiSpec>({
  baseUrl: 'https://api.example.com',
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});

const result = await client.get('/authors/{id}', {
  params: { id: 1 },
});

if (result.status === 200) {
  console.log(result.body.name); // Fully typed as Author
} else if (result.status === 404) {
  console.error(result.body.message); // Fully typed as { message: string }
}
```

## Type Safety Benefits

1. **Path Parameters**: TypeScript will error if you forget to provide required path parameters or provide the wrong type
2. **Response Handling**: The response body type changes based on the status code, enabling exhaustive handling
3. **Request Body**: POST/PUT/PATCH requests have typed body parameters
4. **Query Parameters**: Query strings are fully typed
5. **Autocomplete**: Full IDE autocomplete support for paths, methods, and parameters

## Running the Example

```bash
npm install
npm start
```
