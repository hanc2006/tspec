import { createClient } from 'tspec';
import type { BookApiSpec } from './index';

/**
 * Example client usage demonstrating type-safe API calls
 */

// Create a typed client
const client = createClient<BookApiSpec>({
  baseUrl: 'https://api.example.com',
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});

// Example: Get a book by ID with full type safety
async function getBookById(id: number) {
  const result = await client.get('/books/{id}', {
    params: { id },
    header: { 'X-Request-ID': 'example-request-123' },
    cookie: { debug: 1 },
  });

  // TypeScript knows the exact response types based on status code
  if (result.status === 200) {
    // result.body is typed as Book
    console.log('Book found:', result.body.title);
    console.log('Author:', result.body.id);
    return result.body;
  }
  
  // Handle other status codes if defined in the API spec
  // Note: This example only defines 200 response in the spec
  console.error('Unexpected status:', result.status);
  return null;
}

// Example usage
getBookById(1)
  .then(book => {
    if (book) {
      console.log('Successfully retrieved book:', book);
    }
  })
  .catch(error => {
    console.error('Error fetching book:', error);
  });

export { client };
