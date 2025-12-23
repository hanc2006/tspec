import { Tspec } from './tspec';

/**
 * Extract path parameters from a URL pattern
 * E.g., "/authors/{id}" => { id: string | number }
 */
export type ExtractPathParams<Path extends string> =
  Path extends `${infer _Start}/{${infer Param}}/${infer Rest}`
    ? { [K in Param | keyof ExtractPathParams<`/${Rest}`>]: string | number }
    : Path extends `${infer _Start}/{${infer Param}}`
    ? { [K in Param]: string | number }
    : {};

/**
 * Extract all paths from an API spec
 */
export type PathsFromSpec<Spec> = Spec extends Record<infer P, any>
  ? P extends string
    ? P
    : never
  : never;

/**
 * Extract all HTTP methods for a given path
 */
export type MethodsFromPath<Spec, Path extends string> = 
  Path extends keyof Spec
    ? Spec[Path] extends Record<infer M, any>
      ? M extends Tspec.HttpMethod
        ? M
        : never
      : never
    : never;

/**
 * Extract endpoint spec for a given path and method
 */
export type EndpointSpec<Spec, Path extends string, Method extends string> =
  Path extends keyof Spec
    ? Method extends keyof Spec[Path]
      ? Spec[Path][Method]
      : never
    : never;

/**
 * Extract response types from an endpoint spec
 */
export type ExtractResponses<Spec> = 
  Spec extends { responses: infer R }
    ? R extends Record<number, any>
      ? R
      : never
    : never;

/**
 * Create a discriminated union of responses by status code
 */
export type ClientResponse<Responses> = {
  [Status in keyof Responses]: {
    status: Status;
    body: Responses[Status];
    headers: Headers;
  }
}[keyof Responses];

/**
 * Extract request options for an endpoint
 */
export type RequestOptions<Spec> = {
  params?: Spec extends { path: infer P } ? P : never;
  query?: Spec extends { query: infer Q } ? Q : never;
  body?: Spec extends { body: infer B } ? B : never;
  headers?: Spec extends { header: infer H } ? H : Record<string, string>;
};

/**
 * Client configuration
 */
export interface ClientConfig {
  baseUrl: string;
  baseHeaders?: Record<string, string>;
  fetch?: typeof fetch;
}

/**
 * Type-safe client interface
 */
export type Client<ApiSpec> = {
  [Method in Tspec.HttpMethod]: <
    Path extends PathsFromSpec<ApiSpec>,
    Endpoint extends EndpointSpec<ApiSpec, Path, Method>
  >(
    path: Path,
    options: RequestOptions<Endpoint>
  ) => Promise<ClientResponse<ExtractResponses<Endpoint>>>;
};
