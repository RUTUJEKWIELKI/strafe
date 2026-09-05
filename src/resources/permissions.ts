// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Permissions extends APIResource {
  /**
   * **Required Scopes:** `roles:read`
   *
   * @param {string} channelID
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<PermissionListChannelOverwritesResponse>} Default Response
   *
   * @example
   * ```ts
   * const permission = await client.permissions.listChannelOverwrites('7c9e6679-7425-40de-944b-e07fc1f90ae7');
   * ```
   */
  listChannelOverwrites(
    channelID: string,
    options?: RequestOptions,
  ): APIPromise<PermissionListChannelOverwritesResponse> {
    return this._client.get(__scalarPath`/api/channels/${channelID}/permission-overwrites`, options);
  }

  /**
   * **Required Scopes:** `roles:write`
   *
   * @param {string} subjectID
   * @param {PermissionUpsertChannelOverwriteParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<PermissionUpsertChannelOverwriteResponse>} Default Response
   *
   * @example
   * ```ts
   * const permission = await client.permissions.upsertChannelOverwrite('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   channelId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   *   subjectType: 'role',
   *   allowBits: '',
   *   denyBits: '',
   * });
   * ```
   */
  upsertChannelOverwrite(
    subjectID: string,
    params: PermissionUpsertChannelOverwriteParams,
    options?: RequestOptions,
  ): APIPromise<PermissionUpsertChannelOverwriteResponse> {
    const { channelId, subjectType, ...body } = params;
    return this._client.put(
      __scalarPath`/api/channels/${channelId}/permission-overwrites/${subjectType}/${subjectID}`,
      { body, ...options },
    );
  }

  /**
   * **Required Scopes:** `roles:write`
   *
   * @param {string} subjectID
   * @param {PermissionDeleteChannelOverwriteParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<PermissionDeleteChannelOverwriteResponse>} Default Response
   *
   * @example
   * ```ts
   * const permission = await client.permissions.deleteChannelOverwrite('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   channelId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   *   subjectType: 'role',
   * });
   * ```
   */
  deleteChannelOverwrite(
    subjectID: string,
    params: PermissionDeleteChannelOverwriteParams,
    options?: RequestOptions,
  ): APIPromise<PermissionDeleteChannelOverwriteResponse> {
    const { channelId, subjectType } = params;
    return this._client.delete(
      __scalarPath`/api/channels/${channelId}/permission-overwrites/${subjectType}/${subjectID}`,
      options,
    );
  }
}

export interface PermissionListChannelOverwritesResponse {
  overwrites: Array<PermissionListChannelOverwritesResponse.Overwrite>;
}

export namespace PermissionListChannelOverwritesResponse {
  export interface Overwrite {
    /**
     * @pattern ^[0-9]+$
     */
    allowBits: string;
    /**
     * @format uuid
     */
    channelId: string;
    /**
     * @pattern ^[0-9]+$
     */
    denyBits: string;
    /**
     * @format uuid
     */
    subjectId: string;
    subjectType: 'role' | 'member';
  }
}

export interface PermissionUpsertChannelOverwriteParams {
  /**
   * Path param
   * @format uuid
   */
  channelId: string;
  /**
   * Path param
   */
  subjectType: 'role' | 'member';
  /**
   * Body param
   * @pattern ^[0-9]+$
   */
  allowBits: string;
  /**
   * Body param
   * @pattern ^[0-9]+$
   */
  denyBits: string;
}

export interface PermissionUpsertChannelOverwriteResponse {
  /**
   * @pattern ^[0-9]+$
   */
  allowBits: string;
  /**
   * @format uuid
   */
  channelId: string;
  /**
   * @pattern ^[0-9]+$
   */
  denyBits: string;
  /**
   * @format uuid
   */
  subjectId: string;
  subjectType: 'role' | 'member';
}

export interface PermissionDeleteChannelOverwriteParams {
  /**
   * @format uuid
   */
  channelId: string;
  subjectType: 'role' | 'member';
}

export interface PermissionDeleteChannelOverwriteResponse {
  /**
   * @format uuid
   */
  channelId: string;
  removed: boolean;
  /**
   * @format uuid
   */
  subjectId: string;
  subjectType: 'role' | 'member';
}
export declare namespace Permissions {
  export {
    type PermissionListChannelOverwritesResponse as PermissionListChannelOverwritesResponse,
    type PermissionUpsertChannelOverwriteResponse as PermissionUpsertChannelOverwriteResponse,
    type PermissionDeleteChannelOverwriteResponse as PermissionDeleteChannelOverwriteResponse,
    type PermissionUpsertChannelOverwriteParams as PermissionUpsertChannelOverwriteParams,
    type PermissionDeleteChannelOverwriteParams as PermissionDeleteChannelOverwriteParams,
  };
}
