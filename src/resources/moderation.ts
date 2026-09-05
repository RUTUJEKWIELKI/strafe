// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Moderation extends APIResource {
  /**
   * **Required Scopes:** `members:write`
   *
   * @param {string} userID
   * @param {ModerationKickServerMemberParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ModerationKickServerMemberResponse>} Default Response
   *
   * @example
   * ```ts
   * const moderation = await client.moderation.kickServerMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   * });
   * ```
   */
  kickServerMember(
    userID: string,
    params: ModerationKickServerMemberParams,
    options?: RequestOptions,
  ): APIPromise<ModerationKickServerMemberResponse> {
    const { serverId, ...body } = params;
    return this._client.post(__scalarPath`/api/servers/${serverId}/members/${userID}/kick`, {
      body,
      ...options,
    });
  }

  /**
   * **Required Scopes:** `members:write`
   *
   * @param {string} userID
   * @param {ModerationClearMemberTimeoutParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ModerationClearMemberTimeoutResponse>} Default Response
   *
   * @example
   * ```ts
   * const moderation = await client.moderation.clearMemberTimeout('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   * });
   * ```
   */
  clearMemberTimeout(
    userID: string,
    params: ModerationClearMemberTimeoutParams,
    options?: RequestOptions,
  ): APIPromise<ModerationClearMemberTimeoutResponse> {
    const { serverId } = params;
    return this._client.delete(__scalarPath`/api/servers/${serverId}/members/${userID}/timeout`, options);
  }

  /**
   * **Required Scopes:** `members:write`
   *
   * @param {string} userID
   * @param {ModerationTimeoutMemberParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ModerationTimeoutMemberResponse>} Default Response
   *
   * @example
   * ```ts
   * const moderation = await client.moderation.timeoutMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   *   durationSeconds: 0,
   * });
   * ```
   */
  timeoutMember(
    userID: string,
    params: ModerationTimeoutMemberParams,
    options?: RequestOptions,
  ): APIPromise<ModerationTimeoutMemberResponse> {
    const { serverId, ...body } = params;
    return this._client.post(__scalarPath`/api/servers/${serverId}/members/${userID}/timeout`, {
      body,
      ...options,
    });
  }

  /**
   * **Required Scopes:** `members:write`
   *
   * @param {string} userID
   * @param {ModerationUnbanServerMemberParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ModerationUnbanServerMemberResponse>} Default Response
   *
   * @example
   * ```ts
   * const moderation = await client.moderation.unbanServerMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   * });
   * ```
   */
  unbanServerMember(
    userID: string,
    params: ModerationUnbanServerMemberParams,
    options?: RequestOptions,
  ): APIPromise<ModerationUnbanServerMemberResponse> {
    const { serverId } = params;
    return this._client.delete(__scalarPath`/api/servers/${serverId}/bans/${userID}`, options);
  }

  /**
   * **Required Scopes:** `members:write`
   *
   * @param {string} userID
   * @param {ModerationBanMemberParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ModerationBanMemberResponse>} Default Response
   *
   * @example
   * ```ts
   * const moderation = await client.moderation.banMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   * });
   * ```
   */
  banMember(
    userID: string,
    params: ModerationBanMemberParams,
    options?: RequestOptions,
  ): APIPromise<ModerationBanMemberResponse> {
    const { serverId, ...body } = params;
    return this._client.post(__scalarPath`/api/servers/${serverId}/members/${userID}/ban`, {
      body,
      ...options,
    });
  }
}

export interface ModerationKickServerMemberParams {
  /**
   * Path param
   * @format uuid
   */
  serverId: string;
  /**
   * Body param
   * @maxLength 1024
   */
  reason?: string;
}

export interface ModerationKickServerMemberResponse {
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

export interface ModerationClearMemberTimeoutParams {
  /**
   * @format uuid
   */
  serverId: string;
}

export interface ModerationClearMemberTimeoutResponse {
  cleared: boolean;
  /**
   * @format uuid
   */
  serverId: string;
  /**
   * @format uuid
   */
  userId: string;
}

export interface ModerationTimeoutMemberParams {
  /**
   * Path param
   * @format uuid
   */
  serverId: string;
  /**
   * Body param
   * @minimum 60
   * @maximum 2419200
   */
  durationSeconds: number;
  /**
   * Body param
   * @maxLength 1024
   */
  reason?: string;
}

export interface ModerationTimeoutMemberResponse {
  applied: boolean;
  /**
   * @format uuid
   */
  targetUserId: string;
}

export interface ModerationUnbanServerMemberParams {
  /**
   * @format uuid
   */
  serverId: string;
}

export interface ModerationUnbanServerMemberResponse {
  removed: boolean;
  /**
   * @format uuid
   */
  serverId: string;
  /**
   * @format uuid
   */
  userId: string;
}

export interface ModerationBanMemberParams {
  /**
   * Path param
   * @format uuid
   */
  serverId: string;
  /**
   * Body param
   * @minimum 60
   * @maximum 31536000
   */
  expiresInSeconds?: number;
  /**
   * Body param
   * @maxLength 1024
   */
  reason?: string;
}

export interface ModerationBanMemberResponse {
  applied: boolean;
  /**
   * @format uuid
   */
  targetUserId: string;
}
export declare namespace Moderation {
  export {
    type ModerationKickServerMemberResponse as ModerationKickServerMemberResponse,
    type ModerationClearMemberTimeoutResponse as ModerationClearMemberTimeoutResponse,
    type ModerationTimeoutMemberResponse as ModerationTimeoutMemberResponse,
    type ModerationUnbanServerMemberResponse as ModerationUnbanServerMemberResponse,
    type ModerationBanMemberResponse as ModerationBanMemberResponse,
    type ModerationKickServerMemberParams as ModerationKickServerMemberParams,
    type ModerationClearMemberTimeoutParams as ModerationClearMemberTimeoutParams,
    type ModerationTimeoutMemberParams as ModerationTimeoutMemberParams,
    type ModerationUnbanServerMemberParams as ModerationUnbanServerMemberParams,
    type ModerationBanMemberParams as ModerationBanMemberParams,
  };
}
