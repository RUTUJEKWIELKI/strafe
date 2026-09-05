// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Messages extends APIResource {
  /**
   * **Required Scopes:** `messages:read`
   *
   * @param {string} channelID
   * @param {MessageListParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MessageListResponse>} Default Response
   *
   * @example
   * ```ts
   * const message = await client.messages.list('7c9e6679-7425-40de-944b-e07fc1f90ae7');
   * ```
   */
  list(
    channelID: string,
    query: MessageListParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<MessageListResponse> {
    return this._client.get(__scalarPath`/api/channels/${channelID}/messages`, { query, ...options });
  }

  /**
   * **Required Scopes:** `messages:write`
   *
   * @param {string} channelID
   * @param {MessageCreateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MessageCreateResponse>} Default Response
   *
   * @example
   * ```ts
   * const message = await client.messages.create('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   clientNonce: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   *   envelope: {
   *     authenticationTag: 'xxxxxxxxxxxxxxxx',
   *     ciphertext: 'x',
   *     contentType: 'x',
   *     epoch: 0,
   *     nonce: 'xxxxxxxxxxxxxxxx',
   *     protocolVersion: 1,
   *     senderDeviceId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   *   },
   * });
   * ```
   */
  create(
    channelID: string,
    body: MessageCreateParams,
    options?: RequestOptions,
  ): APIPromise<MessageCreateResponse> {
    return this._client.post(__scalarPath`/api/channels/${channelID}/messages`, { body, ...options });
  }

  /**
   * **Required Scopes:** `messages:write`
   *
   * @param {string} messageID
   * @param {MessageUpdateParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MessageUpdateResponse>} Default Response
   *
   * @example
   * ```ts
   * const message = await client.messages.update('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   envelope: {
   *     authenticationTag: 'xxxxxxxxxxxxxxxx',
   *     ciphertext: 'x',
   *     contentType: 'x',
   *     epoch: 0,
   *     nonce: 'xxxxxxxxxxxxxxxx',
   *     protocolVersion: 1,
   *     senderDeviceId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
   *   },
   * });
   * ```
   */
  update(
    messageID: string,
    body: MessageUpdateParams,
    options?: RequestOptions,
  ): APIPromise<MessageUpdateResponse> {
    return this._client.patch(__scalarPath`/api/messages/${messageID}`, { body, ...options });
  }

  /**
   * **Required Scopes:** `messages:write`
   *
   * @param {string} messageID
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MessageDeleteResponse>} Default Response
   *
   * @example
   * ```ts
   * const message = await client.messages.delete('7c9e6679-7425-40de-944b-e07fc1f90ae7');
   * ```
   */
  delete(messageID: string, options?: RequestOptions): APIPromise<MessageDeleteResponse> {
    return this._client.delete(__scalarPath`/api/messages/${messageID}`, options);
  }

  /**
   * **Required Scopes:** `messages:write`
   *
   * @param {string} messageID
   * @param {MessageCreateReactionParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MessageCreateReactionResponse>} Default Response
   *
   * @example
   * ```ts
   * const message = await client.messages.createReaction('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   emojiKey: 'x',
   * });
   * ```
   */
  createReaction(
    messageID: string,
    body: MessageCreateReactionParams,
    options?: RequestOptions,
  ): APIPromise<MessageCreateReactionResponse> {
    return this._client.put(__scalarPath`/api/messages/${messageID}/reactions`, { body, ...options });
  }

  /**
   * **Required Scopes:** `messages:write`
   *
   * @param {string} messageID
   * @param {MessageDeleteReactionParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<MessageDeleteReactionResponse>} Default Response
   *
   * @example
   * ```ts
   * const message = await client.messages.deleteReaction('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   emojiKey: 'x',
   * });
   * ```
   */
  deleteReaction(
    messageID: string,
    body: MessageDeleteReactionParams,
    options?: RequestOptions,
  ): APIPromise<MessageDeleteReactionResponse> {
    return this._client.delete(__scalarPath`/api/messages/${messageID}/reactions`, { body, ...options });
  }
}

export interface MessageListParams {
  /**
   * @maxLength 512
   */
  before?: string;
  /**
   * @minimum 1
   * @maximum 100
   */
  limit?: number;
}

export interface MessageListResponse {
  messages: Array<MessageListResponse.Message>;
  nextCursor: string | null;
}

export namespace MessageListResponse {
  export interface Message {
    attachmentEnvelopes: Array<Message.AttachmentEnvelope>;
    attachmentIds: Array<string>;
    author: Message.Author | null;
    /**
     * @format uuid
     */
    authorId: string | null;
    /**
     * @format uuid
     */
    channelId: string;
    envelope: Message.Envelope | null;
    migrationState: 'encrypted' | 'legacy_unconvertible';
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format date-time
     */
    deletedAt: string | null;
    /**
     * @format date-time
     */
    editedAt: string | null;
    /**
     * @minimum 0
     */
    flags: number;
    /**
     * @format uuid
     */
    id: string;
    /**
     * @format uuid
     */
    replyToMessageId: string | null;
    type: string;
  }

  export namespace Message {
    export interface AttachmentEnvelope {
      envelope: string;
      /**
       * @format uuid
       */
      fileId: string;
    }

    export interface Author {
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

    export interface Envelope {
      /**
       * @minLength 16
       * @maxLength 128
       */
      authenticationTag: string;
      /**
       * @minLength 1
       * @maxLength 64000
       */
      ciphertext: string;
      /**
       * @minLength 1
       * @maxLength 128
       */
      contentType: string;
      /**
       * @minimum 0
       * @maximum 2147483647
       */
      epoch: number;
      /**
       * @minLength 16
       * @maxLength 128
       */
      nonce: string;
      protocolVersion: 1;
      /**
       * @format uuid
       */
      senderDeviceId: string;
    }
  }
}

export interface MessageCreateParams {
  /**
   * @format uuid
   */
  clientNonce: string;
  envelope: MessageCreateParams.Envelope;
  /**
   * @maxItems 10
   */
  attachmentIds?: Array<string>;
  attachmentEnvelopes?: Record<string, string>;
  /**
   * @format uuid
   */
  replyToMessageId?: string;
}

export namespace MessageCreateParams {
  export interface Envelope {
    /**
     * @minLength 16
     * @maxLength 128
     */
    authenticationTag: string;
    /**
     * @minLength 1
     * @maxLength 64000
     */
    ciphertext: string;
    /**
     * @minLength 1
     * @maxLength 128
     */
    contentType: string;
    /**
     * @minimum 0
     * @maximum 2147483647
     */
    epoch: number;
    /**
     * @minLength 16
     * @maxLength 128
     */
    nonce: string;
    protocolVersion: 1;
    /**
     * @format uuid
     */
    senderDeviceId: string;
  }
}

export interface MessageCreateResponse {
  attachmentEnvelopes: Array<MessageCreateResponse.AttachmentEnvelope>;
  attachmentIds: Array<string>;
  author: MessageCreateResponse.Author | null;
  /**
   * @format uuid
   */
  authorId: string | null;
  /**
   * @format uuid
   */
  channelId: string;
  envelope: MessageCreateResponse.Envelope | null;
  migrationState: 'encrypted' | 'legacy_unconvertible';
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format date-time
   */
  deletedAt: string | null;
  /**
   * @format date-time
   */
  editedAt: string | null;
  /**
   * @minimum 0
   */
  flags: number;
  /**
   * @format uuid
   */
  id: string;
  /**
   * @format uuid
   */
  replyToMessageId: string | null;
  type: string;
}

export namespace MessageCreateResponse {
  export interface AttachmentEnvelope {
    envelope: string;
    /**
     * @format uuid
     */
    fileId: string;
  }

  export interface Author {
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

  export interface Envelope {
    /**
     * @minLength 16
     * @maxLength 128
     */
    authenticationTag: string;
    /**
     * @minLength 1
     * @maxLength 64000
     */
    ciphertext: string;
    /**
     * @minLength 1
     * @maxLength 128
     */
    contentType: string;
    /**
     * @minimum 0
     * @maximum 2147483647
     */
    epoch: number;
    /**
     * @minLength 16
     * @maxLength 128
     */
    nonce: string;
    protocolVersion: 1;
    /**
     * @format uuid
     */
    senderDeviceId: string;
  }
}

export interface MessageUpdateParams {
  envelope: MessageUpdateParams.Envelope;
}

export namespace MessageUpdateParams {
  export interface Envelope {
    /**
     * @minLength 16
     * @maxLength 128
     */
    authenticationTag: string;
    /**
     * @minLength 1
     * @maxLength 64000
     */
    ciphertext: string;
    /**
     * @minLength 1
     * @maxLength 128
     */
    contentType: string;
    /**
     * @minimum 0
     * @maximum 2147483647
     */
    epoch: number;
    /**
     * @minLength 16
     * @maxLength 128
     */
    nonce: string;
    protocolVersion: 1;
    /**
     * @format uuid
     */
    senderDeviceId: string;
  }
}

export interface MessageUpdateResponse {
  attachmentEnvelopes: Array<MessageUpdateResponse.AttachmentEnvelope>;
  attachmentIds: Array<string>;
  author: MessageUpdateResponse.Author | null;
  /**
   * @format uuid
   */
  authorId: string | null;
  /**
   * @format uuid
   */
  channelId: string;
  envelope: MessageUpdateResponse.Envelope | null;
  migrationState: 'encrypted' | 'legacy_unconvertible';
  /**
   * @format date-time
   */
  createdAt: string;
  /**
   * @format date-time
   */
  deletedAt: string | null;
  /**
   * @format date-time
   */
  editedAt: string | null;
  /**
   * @minimum 0
   */
  flags: number;
  /**
   * @format uuid
   */
  id: string;
  /**
   * @format uuid
   */
  replyToMessageId: string | null;
  type: string;
}

export namespace MessageUpdateResponse {
  export interface AttachmentEnvelope {
    envelope: string;
    /**
     * @format uuid
     */
    fileId: string;
  }

  export interface Author {
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

  export interface Envelope {
    /**
     * @minLength 16
     * @maxLength 128
     */
    authenticationTag: string;
    /**
     * @minLength 1
     * @maxLength 64000
     */
    ciphertext: string;
    /**
     * @minLength 1
     * @maxLength 128
     */
    contentType: string;
    /**
     * @minimum 0
     * @maximum 2147483647
     */
    epoch: number;
    /**
     * @minLength 16
     * @maxLength 128
     */
    nonce: string;
    protocolVersion: 1;
    /**
     * @format uuid
     */
    senderDeviceId: string;
  }
}

export interface MessageDeleteResponse {
  deleted: boolean;
}

export interface MessageCreateReactionParams {
  /**
   * @minLength 1
   * @maxLength 128
   */
  emojiKey: string;
}

export interface MessageCreateReactionResponse {
  active: boolean;
}

export interface MessageDeleteReactionParams {
  /**
   * @minLength 1
   * @maxLength 128
   */
  emojiKey: string;
}

export interface MessageDeleteReactionResponse {
  active: boolean;
}
export declare namespace Messages {
  export {
    type MessageListResponse as MessageListResponse,
    type MessageCreateResponse as MessageCreateResponse,
    type MessageUpdateResponse as MessageUpdateResponse,
    type MessageDeleteResponse as MessageDeleteResponse,
    type MessageCreateReactionResponse as MessageCreateReactionResponse,
    type MessageDeleteReactionResponse as MessageDeleteReactionResponse,
    type MessageListParams as MessageListParams,
    type MessageCreateParams as MessageCreateParams,
    type MessageUpdateParams as MessageUpdateParams,
    type MessageCreateReactionParams as MessageCreateReactionParams,
    type MessageDeleteReactionParams as MessageDeleteReactionParams,
  };
}
