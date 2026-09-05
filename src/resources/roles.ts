// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Roles extends APIResource {
  /**
   * **Required Scopes:** `roles:read`
   *
   * @param {string} serverID
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<RoleListServerResponse>} Default Response
   *
   * @example
   * ```ts
   * const role = await client.roles.listServer('7c9e6679-7425-40de-944b-e07fc1f90ae7');
   * ```
   */
  listServer(serverID: string, options?: RequestOptions): APIPromise<RoleListServerResponse> {
    return this._client.get(__scalarPath`/api/servers/${serverID}/roles`, options);
  }

  /**
   * **Required Scopes:** `roles:write`
   *
   * @param {string} serverID
   * @param {RoleCreateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<RoleCreateResponse>} Default Response
   *
   * @example
   * ```ts
   * const role = await client.roles.create('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   name: 'x',
   * });
   * ```
   */
  create(serverID: string, body: RoleCreateParams, options?: RequestOptions): APIPromise<RoleCreateResponse> {
    return this._client.post(__scalarPath`/api/servers/${serverID}/roles`, { body, ...options });
  }

  /**
   * **Required Scopes:** `roles:write`
   *
   * @param {string} roleID
   * @param {RoleUpdateServerParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<RoleUpdateServerResponse>} Default Response
   *
   * @example
   * ```ts
   * const role = await client.roles.updateServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   * });
   * ```
   */
  updateServer(
    roleID: string,
    params: RoleUpdateServerParams,
    options?: RequestOptions,
  ): APIPromise<RoleUpdateServerResponse> {
    const { serverId, ...body } = params;
    return this._client.patch(__scalarPath`/api/servers/${serverId}/roles/${roleID}`, { body, ...options });
  }

  /**
   * **Required Scopes:** `roles:write`
   *
   * @param {string} roleID
   * @param {RoleDeleteServerParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<RoleDeleteServerResponse>} Default Response
   *
   * @example
   * ```ts
   * const role = await client.roles.deleteServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   * });
   * ```
   */
  deleteServer(
    roleID: string,
    params: RoleDeleteServerParams,
    options?: RequestOptions,
  ): APIPromise<RoleDeleteServerResponse> {
    const { serverId } = params;
    return this._client.delete(__scalarPath`/api/servers/${serverId}/roles/${roleID}`, options);
  }

  /**
   * **Required Scopes:** `roles:write`
   *
   * @param {string} serverID
   * @param {RoleReorderServerParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<RoleReorderServerResponse>} Default Response
   *
   * @example
   * ```ts
   * const role = await client.roles.reorderServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   roleIds: [],
   * });
   * ```
   */
  reorderServer(
    serverID: string,
    body: RoleReorderServerParams,
    options?: RequestOptions,
  ): APIPromise<RoleReorderServerResponse> {
    return this._client.put(__scalarPath`/api/servers/${serverID}/roles/order`, { body, ...options });
  }
}

export interface RoleListServerResponse {
  roles: Array<RoleListServerResponse.Role>;
}

export namespace RoleListServerResponse {
  export interface Role {
    color: string | null;
    /**
     * @format uuid
     */
    id: string;
    isDefault: boolean;
    name: string;
    /**
     * @pattern ^[0-9]+$
     */
    permissions: string;
    positionKey: string;
    /**
     * @format uuid
     */
    serverId: string;
  }
}

export interface RoleCreateParams {
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  /**
   * @pattern ^#[0-9A-Fa-f]{6}$
   */
  color?: string;
  /**
   * @pattern ^[0-9]+$
   */
  permissions?: string;
}

export interface RoleCreateResponse {
  color: string | null;
  /**
   * @format uuid
   */
  id: string;
  isDefault: boolean;
  name: string;
  /**
   * @pattern ^[0-9]+$
   */
  permissions: string;
  positionKey: string;
  /**
   * @format uuid
   */
  serverId: string;
}

export interface RoleUpdateServerParams {
  /**
   * Path param
   * @format uuid
   */
  serverId: string;
  /**
   * Body param
   * @pattern ^#[0-9A-Fa-f]{6}$
   */
  color?: string | null;
  /**
   * Body param
   * @minLength 1
   * @maxLength 100
   */
  name?: string;
  /**
   * Body param
   * @pattern ^[0-9]+$
   */
  permissions?: string;
}

export interface RoleUpdateServerResponse {
  color: string | null;
  /**
   * @format uuid
   */
  id: string;
  isDefault: boolean;
  name: string;
  /**
   * @pattern ^[0-9]+$
   */
  permissions: string;
  positionKey: string;
  /**
   * @format uuid
   */
  serverId: string;
}

export interface RoleDeleteServerParams {
  /**
   * @format uuid
   */
  serverId: string;
}

export interface RoleDeleteServerResponse {
  deleted: true;
  /**
   * @format uuid
   */
  roleId: string;
}

export interface RoleReorderServerParams {
  /**
   * Every non-default role ID, ordered from highest to lowest.
   * @maxItems 250
   */
  roleIds: Array<string>;
}

export interface RoleReorderServerResponse {
  roles: Array<RoleReorderServerResponse.Role>;
}

export namespace RoleReorderServerResponse {
  export interface Role {
    color: string | null;
    /**
     * @format uuid
     */
    id: string;
    isDefault: boolean;
    name: string;
    /**
     * @pattern ^[0-9]+$
     */
    permissions: string;
    positionKey: string;
    /**
     * @format uuid
     */
    serverId: string;
  }
}
export declare namespace Roles {
  export {
    type RoleListServerResponse as RoleListServerResponse,
    type RoleCreateResponse as RoleCreateResponse,
    type RoleUpdateServerResponse as RoleUpdateServerResponse,
    type RoleDeleteServerResponse as RoleDeleteServerResponse,
    type RoleReorderServerResponse as RoleReorderServerResponse,
    type RoleCreateParams as RoleCreateParams,
    type RoleUpdateServerParams as RoleUpdateServerParams,
    type RoleDeleteServerParams as RoleDeleteServerParams,
    type RoleReorderServerParams as RoleReorderServerParams,
  };
}
