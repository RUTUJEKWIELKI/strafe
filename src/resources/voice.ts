// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Voice extends APIResource {
  /**
   * **Required Scopes:** `channels:read`
   *
   * @param {string} channelID
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<VoiceCreateTokenResponse>} Default Response
   *
   * @example
   * ```ts
   * const voice = await client.voice.createToken('7c9e6679-7425-40de-944b-e07fc1f90ae7');
   * ```
   */
  createToken(channelID: string, options?: RequestOptions): APIPromise<VoiceCreateTokenResponse> {
    return this._client.post(__scalarPath`/api/channels/${channelID}/voice/token`, options);
  }
}

export interface VoiceCreateTokenResponse {
  /**
   * @format uuid
   */
  channelId: string;
  /**
   * @format date-time
   */
  expiresAt: string;
  /**
   * @format uri
   */
  livekitUrl: string;
  token: string;
}
export declare namespace Voice {
  export { type VoiceCreateTokenResponse as VoiceCreateTokenResponse };
}
