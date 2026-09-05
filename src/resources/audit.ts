// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Audit extends APIResource {
  /**
   * **Required Scopes:** `servers:read`
   *
   * @param {string} serverID
   * @param {AuditListServerLogParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<AuditListServerLogResponse>} Default Response
   *
   * @example
   * ```ts
   * const audit = await client.audit.listServerLog('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   limit: 50,
   * });
   * ```
   */
  listServerLog(
    serverID: string,
    query: AuditListServerLogParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<AuditListServerLogResponse> {
    return this._client.get(__scalarPath`/api/servers/${serverID}/audit-log`, { query, ...options });
  }
}

export interface AuditListServerLogParams {
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

export interface AuditListServerLogResponse {
  entries: Array<AuditListServerLogResponse.Entry>;
  nextCursor: string | null;
}

export namespace AuditListServerLogResponse {
  export interface Entry {
    action: string;
    /**
     * @format uuid
     */
    actorId: string | null;
    /**
     * @format date-time
     */
    createdAt: string;
    /**
     * @format uuid
     */
    id: string;
    metadata: Record<string, unknown>;
    reason: string | null;
    /**
     * @format uuid
     */
    serverId: string;
    /**
     * @format uuid
     */
    targetId: string | null;
    targetType: string | null;
  }
}
export declare namespace Audit {
  export {
    type AuditListServerLogResponse as AuditListServerLogResponse,
    type AuditListServerLogParams as AuditListServerLogParams,
  };
}
