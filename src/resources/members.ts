// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Members extends APIResource {
  /**
   * **Required Scopes:** `members:read`
   *
   * @param {string} serverID
   * @param {MemberListServerParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MemberListServerResponse>} Default Response
   *
   * @example
   * ```ts
   * const member = await client.members.listServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   limit: 50,
   * });
   * ```
   */
  listServer(
    serverID: string,
    query: MemberListServerParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<MemberListServerResponse> {
    return this._client.get(__scalarPath`/api/servers/${serverID}/members`, { query, ...options });
  }

  /**
   * **Required Scopes:** `servers:read`
   *
   * @param {string} serverID
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MemberLeaveServerResponse>} Default Response
   *
   * @example
   * ```ts
   * const member = await client.members.leaveServer('7c9e6679-7425-40de-944b-e07fc1f90ae7');
   * ```
   */
  leaveServer(serverID: string, options?: RequestOptions): APIPromise<MemberLeaveServerResponse> {
    return this._client.delete(__scalarPath`/api/servers/${serverID}/members/@me`, options);
  }

  /**
   * **Required Scopes:** `roles:write`
   *
   * @param {string} userID
   * @param {MemberReplaceRolesParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MemberReplaceRolesResponse>} Default Response
   *
   * @example
   * ```ts
   * const member = await client.members.replaceRoles('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   *   roleIds: [],
   * });
   * ```
   */
  replaceRoles(
    userID: string,
    params: MemberReplaceRolesParams,
    options?: RequestOptions,
  ): APIPromise<MemberReplaceRolesResponse> {
    const { serverId, ...body } = params;
    return this._client.put(__scalarPath`/api/servers/${serverId}/members/${userID}/roles`, {
      body,
      ...options,
    });
  }
}

export interface MemberListServerParams {
  /**
   * @minLength 1
   * @maxLength 2048
   */
  before?: string;
  /**
   * @default 50
   * @minimum 1
   * @maximum 100
   */
  limit?: number;
}

export interface MemberListServerResponse {
  members: Array<MemberListServerResponse.Member>;
  nextCursor: string | null;
}

export namespace MemberListServerResponse {
  export interface Member {
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format date-time
     */
    joinedAt: string;
    nickname: string | null;
    /**
     * @minimum 1
     */
    permissionsVersion: number;
    roleIds: Array<string>;
    /**
     * @format date-time
     */
    timeoutUntil: string | null;
    user: Member.User;
  }

  export namespace Member {
    export interface User {
      /**
       * @format uri
       */
      avatarUrl: string | null;
      /**
       * @format date-time
       */
      createdAt: string;
      displayName: string;
      handle: string;
      /**
       * @format uuid
       */
      id: string;
      status: 'active' | 'disabled' | 'pending_deletion';
    }
  }
}

export interface MemberLeaveServerResponse {
  /**
   * @format uuid
   */
  serverId: string;
  state: 'left';
  /**
   * @format uuid
   */
  userId: string;
}

export interface MemberReplaceRolesParams {
  /**
   * Path param
   * @format uuid
   */
  serverId: string;
  /**
   * Body param
   * @maxItems 100
   */
  roleIds: Array<string>;
}

export interface MemberReplaceRolesResponse {
  /**
   * @format uuid
   */
  memberId: string;
  /**
   * @minimum 1
   */
  permissionsVersion: number;
  roleIds: Array<string>;
}
export declare namespace Members {
  export {
    type MemberListServerResponse as MemberListServerResponse,
    type MemberLeaveServerResponse as MemberLeaveServerResponse,
    type MemberReplaceRolesResponse as MemberReplaceRolesResponse,
    type MemberListServerParams as MemberListServerParams,
    type MemberReplaceRolesParams as MemberReplaceRolesParams,
  };
}
