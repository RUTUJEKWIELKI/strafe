// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Channels extends APIResource {
  /**
   * **Required Scopes:** `channels:write`
   *
   * @param {string} channelID
   * @param {ChannelUpdateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ChannelUpdateResponse>} Default Response
   *
   * @example
   * ```ts
   * const channel = await client.channels.update('7c9e6679-7425-40de-944b-e07fc1f90ae7', {});
   * ```
   */
  update(
    channelID: string,
    body: ChannelUpdateParams,
    options?: RequestOptions,
  ): APIPromise<ChannelUpdateResponse> {
    return this._client.patch(__scalarPath`/api/channels/${channelID}`, { body, ...options });
  }

  /**
   * **Required Scopes:** `channels:write`
   *
   * @param {string} channelID
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ChannelDeleteResponse>} Default Response
   *
   * @example
   * ```ts
   * const channel = await client.channels.delete('7c9e6679-7425-40de-944b-e07fc1f90ae7');
   * ```
   */
  delete(channelID: string, options?: RequestOptions): APIPromise<ChannelDeleteResponse> {
    return this._client.delete(__scalarPath`/api/channels/${channelID}`, options);
  }

  /**
   * **Required Scopes:** `channels:write`
   *
   * @param {string} serverID
   * @param {ChannelReorderServerParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ChannelReorderServerResponse>} Default Response
   *
   * @example
   * ```ts
   * const channel = await client.channels.reorderServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   items: [],
   * });
   * ```
   */
  reorderServer(
    serverID: string,
    body: ChannelReorderServerParams,
    options?: RequestOptions,
  ): APIPromise<ChannelReorderServerResponse> {
    return this._client.put(__scalarPath`/api/servers/${serverID}/channels/order`, { body, ...options });
  }

  /**
   * **Required Scopes:** `channels:read`
   *
   * @param {string} serverID
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ChannelListServerResponse>} Default Response
   *
   * @example
   * ```ts
   * const channel = await client.channels.listServer('7c9e6679-7425-40de-944b-e07fc1f90ae7');
   * ```
   */
  listServer(serverID: string, options?: RequestOptions): APIPromise<ChannelListServerResponse> {
    return this._client.get(__scalarPath`/api/servers/${serverID}/channels`, options);
  }

  /**
   * **Required Scopes:** `channels:write`
   *
   * @param {string} serverID
   * @param {ChannelCreateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ChannelCreateResponse>} Default Response
   *
   * @example
   * ```ts
   * const channel = await client.channels.create('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   name: 'x',
   *   type: 'category',
   * });
   * ```
   */
  create(
    serverID: string,
    body: ChannelCreateParams,
    options?: RequestOptions,
  ): APIPromise<ChannelCreateResponse> {
    return this._client.post(__scalarPath`/api/servers/${serverID}/channels`, { body, ...options });
  }
}

export interface ChannelUpdateParams {
  /**
   * @minLength 1
   * @maxLength 100
   */
  name?: string;
  /**
   * @format uuid
   */
  parentId?: string | null;
  /**
   * @minimum 0
   * @maximum 21600
   */
  slowmodeSeconds?: number;
  /**
   * @maxLength 1024
   */
  topic?: string | null;
}

export interface ChannelUpdateResponse {
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

export interface ChannelDeleteResponse {
  /**
   * @format uuid
   */
  channelId: string;
  deleted: true;
}

export interface ChannelReorderServerParams {
  /**
   * Every active server channel in display order, including categories.
   * @minItems 1
   * @maxItems 500
   */
  items: Array<ChannelReorderServerParams.Item>;
}

export namespace ChannelReorderServerParams {
  export interface Item {
    /**
     * @format uuid
     */
    channelId: string;
    /**
     * @format uuid
     */
    parentId: string | null;
  }
}

export interface ChannelReorderServerResponse {
  channels: Array<ChannelReorderServerResponse.Channel>;
}

export namespace ChannelReorderServerResponse {
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

export interface ChannelListServerResponse {
  channels: Array<ChannelListServerResponse.Channel>;
}

export namespace ChannelListServerResponse {
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

export interface ChannelCreateParams {
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
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
  encrypted?: boolean;
  /**
   * @format uuid
   */
  parentId?: string;
  /**
   * @minimum 0
   * @maximum 21600
   */
  slowmodeSeconds?: number;
  /**
   * @maxLength 1024
   */
  topic?: string;
}

export interface ChannelCreateResponse {
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
export declare namespace Channels {
  export {
    type ChannelUpdateResponse as ChannelUpdateResponse,
    type ChannelDeleteResponse as ChannelDeleteResponse,
    type ChannelReorderServerResponse as ChannelReorderServerResponse,
    type ChannelListServerResponse as ChannelListServerResponse,
    type ChannelCreateResponse as ChannelCreateResponse,
    type ChannelUpdateParams as ChannelUpdateParams,
    type ChannelReorderServerParams as ChannelReorderServerParams,
    type ChannelCreateParams as ChannelCreateParams,
  };
}
