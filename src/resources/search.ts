// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';

export class Search extends APIResource {
  /**
   * **Required Scopes:** `messages:read`
   *
   * @param {SearchMessagesParams} query - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<SearchMessagesResponse>} Default Response
   *
   * @example
   * ```ts
   * const search = await client.search.messages({
   *   q: 'q',
   * });
   * ```
   */
  messages(query: SearchMessagesParams, options?: RequestOptions): APIPromise<SearchMessagesResponse> {
    return this._client.get('/api/search/messages', { query, ...options });
  }

  /**
   * **Required Scopes:** `servers:read`
   *
   * @param {SearchServersParams} query - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<SearchServersResponse>} Default Response
   *
   * @example
   * ```ts
   * const search = await client.search.servers({
   *   q: 'q',
   * });
   * ```
   */
  servers(query: SearchServersParams, options?: RequestOptions): APIPromise<SearchServersResponse> {
    return this._client.get('/api/search/servers', { query, ...options });
  }
}

export interface SearchMessagesParams {
  /**
   * @format uuid
   */
  channelId?: string;
  /**
   * @minimum 1
   * @maximum 50
   */
  limit?: number;
  /**
   * @minimum 0
   * @maximum 5000
   */
  offset?: number;
  /**
   * @minLength 1
   * @maxLength 200
   */
  q: string;
  /**
   * @format uuid
   */
  serverId?: string;
}

export interface SearchMessagesResponse {
  /**
   * @minimum 0
   */
  estimatedTotalHits: number;
  hits: Array<SearchMessagesResponse.Hit>;
  /**
   * @minimum 1
   */
  limit: number;
  /**
   * @minimum 0
   */
  offset: number;
}

export namespace SearchMessagesResponse {
  export interface Hit {
    /**
     * @format uuid
     */
    authorId: string | null;
    /**
     * @format uuid
     */
    channelId: string;
    content: string;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format uuid
     */
    serverId: string | null;
  }
}

export interface SearchServersParams {
  /**
   * @minimum 1
   * @maximum 50
   */
  limit?: number;
  /**
   * @minimum 0
   * @maximum 5000
   */
  offset?: number;
  /**
   * @minLength 1
   * @maxLength 200
   */
  q: string;
}

export interface SearchServersResponse {
  /**
   * @minimum 0
   */
  estimatedTotalHits: number;
  hits: Array<SearchServersResponse.Hit>;
  /**
   * @minimum 1
   */
  limit: number;
  /**
   * @minimum 0
   */
  offset: number;
}

export namespace SearchServersResponse {
  export interface Hit {
    description: string | null;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @minimum 0
     */
    memberCount: number;
    name: string;
    slug: string;
  }
}
export declare namespace Search {
  export {
    type SearchMessagesResponse as SearchMessagesResponse,
    type SearchServersResponse as SearchServersResponse,
    type SearchMessagesParams as SearchMessagesParams,
    type SearchServersParams as SearchServersParams,
  };
}
