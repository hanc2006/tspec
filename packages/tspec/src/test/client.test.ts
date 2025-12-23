import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '../client';
import type { Tspec } from '../types/tspec';
import type { ExtractPathParams, ClientResponse, Client } from '../types/client';

// Define a test API spec
interface Author {
  id: number;
  name: string;
}

interface Book {
  id: number;
  title: string;
  authorId: number;
}

type TestApiSpec = Tspec.DefineApiSpec<{
  paths: {
    '/authors/{id}': {
      get: {
        summary: 'Get author by id';
        path: { id: number };
        responses: {
          200: Author;
          404: { message: string };
        };
      };
    };
    '/books': {
      get: {
        summary: 'List books';
        query: { page: number; limit: number };
        responses: {
          200: Book[];
        };
      };
      post: {
        summary: 'Create a book';
        body: Omit<Book, 'id'>;
        responses: {
          201: Book;
          400: { error: string };
        };
      };
    };
    '/books/{id}': {
      put: {
        summary: 'Update a book';
        path: { id: number };
        body: Partial<Book>;
        responses: {
          200: Book;
          404: { message: string };
        };
      };
      delete: {
        summary: 'Delete a book';
        path: { id: number };
        responses: {
          204: '';
        };
      };
    };
  };
}>;

describe('Client Type System', () => {
  describe('ExtractPathParams', () => {
    it('should extract single path parameter', () => {
      type Params = ExtractPathParams<'/authors/{id}'>;
      const params: Params = { id: 1 };
      expect(params.id).toBe(1);
    });

    it('should extract multiple path parameters', () => {
      type Params = ExtractPathParams<'/authors/{authorId}/books/{bookId}'>;
      const params: Params = { authorId: 1, bookId: 2 };
      expect(params.authorId).toBe(1);
      expect(params.bookId).toBe(2);
    });

    it('should return empty object for paths without parameters', () => {
      type Params = ExtractPathParams<'/books'>;
      const params: Params = {};
      expect(params).toEqual({});
    });
  });
});

describe('Client Runtime', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  describe('createClient', () => {
    it('should create a client with all HTTP methods', () => {
      const client = createClient<TestApiSpec>({
        baseUrl: 'https://api.example.com',
        fetch: mockFetch,
      });

      expect(client.get).toBeDefined();
      expect(client.post).toBeDefined();
      expect(client.put).toBeDefined();
      expect(client.patch).toBeDefined();
      expect(client.delete).toBeDefined();
      expect(client.options).toBeDefined();
      expect(client.head).toBeDefined();
    });

    it('should substitute path parameters in URL', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ id: 1, name: 'John Doe' }),
      });

      const client = createClient<TestApiSpec>({
        baseUrl: 'https://api.example.com',
        fetch: mockFetch,
      });

      await client.get('/authors/{id}', {
        params: { id: 1 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/authors/1',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should build query string from query parameters', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => [],
      });

      const client = createClient<TestApiSpec>({
        baseUrl: 'https://api.example.com',
        fetch: mockFetch,
      });

      await client.get('/books', {
        query: { page: 1, limit: 10 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/books?page=1&limit=10',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should send JSON body for POST requests', async () => {
      mockFetch.mockResolvedValue({
        status: 201,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ id: 1, title: 'New Book', authorId: 1 }),
      });

      const client = createClient<TestApiSpec>({
        baseUrl: 'https://api.example.com',
        fetch: mockFetch,
      });

      await client.post('/books', {
        body: { title: 'New Book', authorId: 1 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/books',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'New Book', authorId: 1 }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should merge base headers with request headers', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ id: 1, name: 'John Doe' }),
      });

      const client = createClient<TestApiSpec>({
        baseUrl: 'https://api.example.com',
        baseHeaders: {
          'Authorization': 'Bearer token',
        },
        fetch: mockFetch,
      });

      await client.get('/authors/{id}', {
        params: { id: 1 },
        headers: { 'X-Request-ID': '123' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/authors/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token',
            'X-Request-ID': '123',
          }),
        })
      );
    });

    it('should return response with correct status and body', async () => {
      const expectedAuthor = { id: 1, name: 'John Doe' };
      mockFetch.mockResolvedValue({
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => expectedAuthor,
      });

      const client = createClient<TestApiSpec>({
        baseUrl: 'https://api.example.com',
        fetch: mockFetch,
      });

      const response = await client.get('/authors/{id}', {
        params: { id: 1 },
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedAuthor);
    });

    it('should handle 404 responses', async () => {
      const errorBody = { message: 'Author not found' };
      mockFetch.mockResolvedValue({
        status: 404,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => errorBody,
      });

      const client = createClient<TestApiSpec>({
        baseUrl: 'https://api.example.com',
        fetch: mockFetch,
      });

      const response = await client.get('/authors/{id}', {
        params: { id: 999 },
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual(errorBody);
    });

    it('should handle PUT requests with path params and body', async () => {
      const updatedBook = { id: 1, title: 'Updated Book', authorId: 1 };
      mockFetch.mockResolvedValue({
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => updatedBook,
      });

      const client = createClient<TestApiSpec>({
        baseUrl: 'https://api.example.com',
        fetch: mockFetch,
      });

      await client.put('/books/{id}', {
        params: { id: 1 },
        body: { title: 'Updated Book' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/books/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ title: 'Updated Book' }),
        })
      );
    });

    it('should handle DELETE requests', async () => {
      mockFetch.mockResolvedValue({
        status: 204,
        headers: new Headers(),
        text: async () => '',
      });

      const client = createClient<TestApiSpec>({
        baseUrl: 'https://api.example.com',
        fetch: mockFetch,
      });

      const response = await client.delete('/books/{id}', {
        params: { id: 1 },
      });

      expect(response.status).toBe(204);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/books/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle non-JSON responses', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        text: async () => 'Plain text response',
      });

      const client = createClient<TestApiSpec>({
        baseUrl: 'https://api.example.com',
        fetch: mockFetch,
      });

      const response = await client.get('/authors/{id}', {
        params: { id: 1 },
      });

      expect(response.body).toBe('Plain text response');
    });

    it('should handle array query parameters', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => [],
      });

      const client = createClient<TestApiSpec>({
        baseUrl: 'https://api.example.com',
        fetch: mockFetch,
      });

      type ExtendedApiSpec = Tspec.DefineApiSpec<{
        paths: {
          '/books': {
            get: {
              query: { tags: string[] };
              responses: { 200: Book[] };
            };
          };
        };
      }>;

      const extendedClient = createClient<ExtendedApiSpec>({
        baseUrl: 'https://api.example.com',
        fetch: mockFetch,
      });

      await extendedClient.get('/books', {
        query: { tags: ['fiction', 'adventure'] },
      });

      // URLSearchParams will append multiple values
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('tags=fiction');
      expect(calledUrl).toContain('tags=adventure');
    });

    it('should use global fetch when custom fetch not provided', async () => {
      // Save original fetch
      const originalFetch = globalThis.fetch;
      
      // Mock global fetch
      const mockGlobalFetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ id: 1, name: 'John Doe' }),
      });
      globalThis.fetch = mockGlobalFetch;

      const client = createClient<TestApiSpec>({
        baseUrl: 'https://api.example.com',
      });

      await client.get('/authors/{id}', {
        params: { id: 1 },
      });

      expect(mockGlobalFetch).toHaveBeenCalled();

      // Restore original fetch
      globalThis.fetch = originalFetch;
    });

    it('should send cookies as Cookie header', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ id: 1, name: 'John Doe' }),
      });

      type ApiSpecWithCookies = Tspec.DefineApiSpec<{
        paths: {
          '/authors/{id}': {
            get: {
              path: { id: number };
              cookie: { sessionId: string; debug: number };
              responses: { 200: Author };
            };
          };
        };
      }>;

      const client = createClient<ApiSpecWithCookies>({
        baseUrl: 'https://api.example.com',
        fetch: mockFetch,
      });

      await client.get('/authors/{id}', {
        params: { id: 1 },
        cookies: { sessionId: 'abc123', debug: 1 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/authors/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Cookie': 'sessionId=abc123; debug=1',
          }),
        })
      );
    });
  });
});
