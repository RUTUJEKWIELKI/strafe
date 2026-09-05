// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';

export class DirectMessages extends APIResource {
  /**
   * **Required Scopes:** `channels:read`
   *
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<DirectMessageListResponse>} Default Response
   *
   * @example
   * ```ts
   * const directMessage = await client.directMessages.list();
   * ```
   */
  list(options?: RequestOptions): APIPromise<DirectMessageListResponse> {
    return this._client.get('/api/users/@me/dms', options);
  }

  /**
   * **Required Scopes:** `messages:write`
   *
   * @param {DirectMessageCreateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<DirectMessageCreateResponse>} Default Response
   *
   * @example
   * ```ts
   * const directMessage = await client.directMessages.create({
   *   recipientId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   * });
   * ```
   */
  create(body: DirectMessageCreateParams, options?: RequestOptions): APIPromise<DirectMessageCreateResponse> {
    return this._client.post('/api/users/@me/dms', { body, ...options });
  }
}

export interface DirectMessageListResponse {
  channels: Array<DirectMessageListResponse.Channel>;
}

export namespace DirectMessageListResponse {
  export interface Channel {
    /**
     * @format date-time
     */
    archivedAt: string | null;
    /**
     * @minimum 0
     */
    flags: number;
    /**
     * @format uuid
     */
    id: string;
    name: string;
    /**
     * @format uuid
     */
    parentId: string | null;
    positionKey: string;
    /**
     * @format uuid
     */
    serverId: string | null;
    /**
     * @minimum 0
     */
    slowmodeSeconds: number;
    topic: string | null;
    type:
      | 'category'
      | 'text'
      | 'announcement'
      | 'forum'
      | 'voice'
      | 'stage'
      | 'thread_public'
      | 'thread_private'
      | 'dm'
      | 'group_dm';
  }
}

export interface DirectMessageCreateParams {
  /**
   * @format uuid
   */
  recipientId: string;
}

export interface DirectMessageCreateResponse {
  /**
   * @format date-time
   */
  archivedAt: string | null;
  /**
   * @minimum 0
   */
  flags: number;
  /**
   * @format uuid
   */
  id: string;
  name: string;
  /**
   * @format uuid
   */
  parentId: string | null;
  positionKey: string;
  /**
   * @format uuid
   */
  serverId: string | null;
  /**
   * @minimum 0
   */
  slowmodeSeconds: number;
  topic: string | null;
  type:
    | 'category'
    | 'text'
    | 'announcement'
    | 'forum'
    | 'voice'
    | 'stage'
    | 'thread_public'
    | 'thread_private'
    | 'dm'
    | 'group_dm';
}
export declare namespace DirectMessages {
  export {
    type DirectMessageListResponse as DirectMessageListResponse,
    type DirectMessageCreateResponse as DirectMessageCreateResponse,
    type DirectMessageCreateParams as DirectMessageCreateParams,
  };
}
