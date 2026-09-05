// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { buildHeaders } from '../internal/headers';
import { path as __scalarPath } from '../internal/utils/path';

export class Users extends APIResource {
  /**
   * **Required Scopes:** None (accessible to any valid bot token)
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<UserListCurrentResponse>} Default Response
   *
   * @example
   * ```ts
   * const user = await client.users.listCurrent();
   * ```
   */
  listCurrent(options?: RequestOptions): APIPromise<UserListCurrentResponse> {
    return this._client.get('/api/users/@me', options);
  }

  /**
   * **Required Scopes:** `users:write`
   *
   * @param {UserUpdateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns Default Response
   *
   * @example
   * ```ts
   * await client.users.update({});
   * ```
   */
  update(body: UserUpdateParams, options?: RequestOptions): APIPromise<void> {
    return this._client.patch('/api/users/@me', {
      body,
      ...options,
      headers: buildHeaders([{ Accept: '*/*' }, options?.headers]),
    });
  }

  /**
   * **Required Scopes:** `users:read`
   *
   * @param {string} userID
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<UserRetrieveResponse>} Default Response
   *
   * @example
   * ```ts
   * const user = await client.users.retrieve('7c9e6679-7425-40de-944b-e07fc1f90ae7');
   * ```
   */
  retrieve(userID: string, options?: RequestOptions): APIPromise<UserRetrieveResponse> {
    return this._client.get(__scalarPath`/api/users/${userID}`, options);
  }
}

export interface UserListCurrentResponse {
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
  /**
   * @format email
   */
  email: string;
  emailVerified: boolean;
}

export interface UserUpdateParams {
  /**
   * @minLength 1
   * @maxLength 64
   */
  displayName?: string;
  /**
   * @maxLength 500
   */
  bio?: string | null;
  /**
   * @maxLength 32
   */
  pronouns?: string | null;
  /**
   * @format uuid
   */
  avatarFileId?: string | null;
  /**
   * @format uuid
   */
  bannerFileId?: string | null;
}

export interface UserRetrieveResponse {
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
export declare namespace Users {
  export {
    type UserListCurrentResponse as UserListCurrentResponse,
    type UserRetrieveResponse as UserRetrieveResponse,
    type UserUpdateParams as UserUpdateParams,
  };
}
