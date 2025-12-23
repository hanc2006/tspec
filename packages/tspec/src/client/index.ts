import type { ClientConfig, Client, ClientResponse } from '../types/client';

/**
 * Substitute path parameters in a URL pattern
 * E.g., "/authors/{id}" with params { id: 1 } => "/authors/1"
 */
function substitutePath(path: string, params?: Record<string, string | number>): string {
  if (!params) return path;
  
  let result = path;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`{${key}}`, String(value));
  }
  return result;
}

/**
 * Build query string from query parameters
 */
function buildQueryString(query?: Record<string, any>): string {
  if (!query) return '';
  
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    }
  }
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Create a type-safe API client
 */
export function createClient<ApiSpec>(config: ClientConfig): Client<ApiSpec> {
  const { baseUrl, baseHeaders = {}, fetch: customFetch = globalThis.fetch } = config;

  async function request(
    method: string,
    path: string,
    options: any
  ): Promise<ClientResponse<any>> {
    const { params, query, body, headers = {} } = options || {};
    
    // Substitute path parameters
    const substitutedPath = substitutePath(path, params);
    
    // Build query string
    const queryString = buildQueryString(query);
    
    // Build full URL
    const url = `${baseUrl}${substitutedPath}${queryString}`;
    
    // Merge headers
    const mergedHeaders = {
      ...baseHeaders,
      ...headers,
    };
    
    // Build request options
    const requestOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: mergedHeaders,
    };
    
    // Add body if present
    if (body !== undefined) {
      if (mergedHeaders['Content-Type'] === 'application/json' || 
          !mergedHeaders['Content-Type']) {
        requestOptions.body = JSON.stringify(body);
        if (!mergedHeaders['Content-Type']) {
          mergedHeaders['Content-Type'] = 'application/json';
        }
      } else {
        requestOptions.body = body as any;
      }
    }
    
    // Make request
    const response = await customFetch(url, requestOptions);
    
    // Parse response body
    let responseBody: any;
    const contentType = response.headers.get('Content-Type');
    
    if (contentType?.includes('application/json')) {
      try {
        responseBody = await response.json();
      } catch (e) {
        responseBody = null;
      }
    } else {
      responseBody = await response.text();
    }
    
    return {
      status: response.status as any,
      body: responseBody,
      headers: response.headers,
    } as ClientResponse<any>;
  }

  // Create client with methods for each HTTP verb
  const client: any = {};
  
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
  for (const method of methods) {
    client[method] = (path: string, options?: any) => request(method, path, options);
  }

  return client as Client<ApiSpec>;
}
