// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Servers extends APIResource {
  /**
   * **Required Scopes:** `servers:write`
   *
   * @param {string} serverID
   * @param {ServerUpdateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ServerUpdateResponse>} Default Response
   *
   * @example
   * ```ts
   * const server = await client.servers.update('7c9e6679-7425-40de-944b-e07fc1f90ae7', {});
   * ```
   */
  update(
    serverID: string,
    body: ServerUpdateParams,
    options?: RequestOptions,
  ): APIPromise<ServerUpdateResponse> {
    return this._client.patch(__scalarPath`/api/servers/${serverID}`, { body, ...options });
  }

  /**
   * **Required Scopes:** `servers:write`
   *
   * @param {string} serverID
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ServerDeleteResponse>} Default Response
   *
   * @example
   * ```ts
   * const server = await client.servers.delete('7c9e6679-7425-40de-944b-e07fc1f90ae7');
   * ```
   */
  delete(serverID: string, options?: RequestOptions): APIPromise<ServerDeleteResponse> {
    return this._client.delete(__scalarPath`/api/servers/${serverID}`, options);
  }

  /**
   * **Required Scopes:** `servers:read`
   *
   * @param {string} serverID
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ServerRetrieveResponse>} Default Response
   *
   * @example
   * ```ts
   * const server = await client.servers.retrieve('7c9e6679-7425-40de-944b-e07fc1f90ae7');
   * ```
   */
  retrieve(serverID: string, options?: RequestOptions): APIPromise<ServerRetrieveResponse> {
    return this._client.get(__scalarPath`/api/servers/${serverID}`, options);
  }

  /**
   * **Required Scopes:** `servers:write`
   *
   * @param {string} serverID
   * @param {ServerTransferOwnershipParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ServerTransferOwnershipResponse>} Default Response
   *
   * @example
   * ```ts
   * const server = await client.servers.transferOwnership('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   newOwnerId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   * });
   * ```
   */
  transferOwnership(
    serverID: string,
    body: ServerTransferOwnershipParams,
    options?: RequestOptions,
  ): APIPromise<ServerTransferOwnershipResponse> {
    return this._client.post(__scalarPath`/api/servers/${serverID}/transfer-ownership`, { body, ...options });
  }

  /**
   * **Required Scopes:** `servers:read`
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ServerListCurrentUserResponse>} Default Response
   *
   * @example
   * ```ts
   * const server = await client.servers.listCurrentUser();
   * ```
   */
  listCurrentUser(options?: RequestOptions): APIPromise<ServerListCurrentUserResponse> {
    return this._client.get('/api/users/@me/servers', options);
  }
}

export interface ServerUpdateParams {
  /**
   * @maxLength 1024
   */
  description?: string | null;
  /**
   * @minLength 1
   * @maxLength 100
   */
  name?: string;
  visibility?: 'private' | 'unlisted' | 'public';
}

export interface ServerUpdateResponse {
  /**
   * @format date-time
   */
  createdAt: string;
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
  /**
   * @format uuid
   */
  ownerId: string;
  slug: string;
  /**
   * @minimum 1
   */
  version: number;
  visibility: 'private' | 'unlisted' | 'public';
}

export interface ServerDeleteResponse {
  deleted: true;
  /**
   * @format uuid
   */
  serverId: string;
}

export interface ServerRetrieveResponse {
  /**
   * @format date-time
   */
  createdAt: string;
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
  /**
   * @format uuid
   */
  ownerId: string;
  slug: string;
  /**
   * @minimum 1
   */
  version: number;
  visibility: 'private' | 'unlisted' | 'public';
}

export interface ServerTransferOwnershipParams {
  /**
   * @format uuid
   */
  newOwnerId: string;
}

export interface ServerTransferOwnershipResponse {
  /**
   * @format date-time
   */
  createdAt: string;
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
  /**
   * @format uuid
   */
  ownerId: string;
  slug: string;
  /**
   * @minimum 1
   */
  version: number;
  visibility: 'private' | 'unlisted' | 'public';
}

export interface ServerListCurrentUserResponse {
  servers: Array<ServerListCurrentUserResponse.Server>;
}

export namespace ServerListCurrentUserResponse {
  export interface Server {
    /**
     * @format date-time
     */
    createdAt: string;
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
    /**
     * @format uuid
     */
    ownerId: string;
    slug: string;
    /**
     * @minimum 1
     */
    version: number;
    visibility: 'private' | 'unlisted' | 'public';
  }
}
export declare namespace Servers {
  export {
    type ServerUpdateResponse as ServerUpdateResponse,
    type ServerDeleteResponse as ServerDeleteResponse,
    type ServerRetrieveResponse as ServerRetrieveResponse,
    type ServerTransferOwnershipResponse as ServerTransferOwnershipResponse,
    type ServerListCurrentUserResponse as ServerListCurrentUserResponse,
    type ServerUpdateParams as ServerUpdateParams,
    type ServerTransferOwnershipParams as ServerTransferOwnershipParams,
  };
}
