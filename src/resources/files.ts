// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { path as __scalarPath } from '../internal/utils/path';

export class Files extends APIResource {
  /**
   * **Required Scopes:** `messages:write`
   *
   * @param {FileInitiateUploadParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FileInitiateUploadResponse>} Default Response
   *
   * @example
   * ```ts
   * const file = await client.files.initiateUpload({
   *   purpose: 'attachment',
   *   sizeBytes: 0,
   * });
   * ```
   */
  initiateUpload(
    body: FileInitiateUploadParams,
    options?: RequestOptions,
  ): APIPromise<FileInitiateUploadResponse> {
    return this._client.post('/api/files/uploads', { body, ...options });
  }

  /**
   * **Required Scopes:** `messages:write`
   *
   * @param {string} uploadID
   * @param {FilePresignUploadPartParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FilePresignUploadPartResponse>} Default Response
   *
   * @example
   * ```ts
   * const file = await client.files.presignUploadPart('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   partNumber: 0,
   * });
   * ```
   */
  presignUploadPart(
    uploadID: string,
    body: FilePresignUploadPartParams,
    options?: RequestOptions,
  ): APIPromise<FilePresignUploadPartResponse> {
    return this._client.post(__scalarPath`/api/files/uploads/${uploadID}/parts`, { body, ...options });
  }

  /**
   * **Required Scopes:** `messages:write`
   *
   * @param {string} uploadID
   * @param {FileCompleteUploadParams} body - The request body to send.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FileCompleteUploadResponse>} Default Response
   *
   * @example
   * ```ts
   * const file = await client.files.completeUpload('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
   *   parts: [],
   * });
   * ```
   */
  completeUpload(
    uploadID: string,
    body: FileCompleteUploadParams,
    options?: RequestOptions,
  ): APIPromise<FileCompleteUploadResponse> {
    return this._client.post(__scalarPath`/api/files/uploads/${uploadID}/complete`, { body, ...options });
  }

  /**
   * **Required Scopes:** `messages:write`
   *
   * @param {string} uploadID
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FileAbortUploadResponse>} Default Response
   *
   * @example
   * ```ts
   * const file = await client.files.abortUpload('7c9e6679-7425-40de-944b-e07fc1f90ae7');
   * ```
   */
  abortUpload(uploadID: string, options?: RequestOptions): APIPromise<FileAbortUploadResponse> {
    return this._client.delete(__scalarPath`/api/files/uploads/${uploadID}`, options);
  }

  /**
   * **Required Scopes:** `messages:read`
   *
   * @param {string} fileID
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FileRetrieveResponse>} Default Response
   *
   * @example
   * ```ts
   * const file = await client.files.retrieve('7c9e6679-7425-40de-944b-e07fc1f90ae7');
   * ```
   */
  retrieve(fileID: string, options?: RequestOptions): APIPromise<FileRetrieveResponse> {
    return this._client.get(__scalarPath`/api/files/${fileID}`, options);
  }

  /**
   * **Required Scopes:** `messages:read`
   *
   * @param {string} fileID
   * @param {FileDownloadParams} [query] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<FileDownloadResponse>} Default Response
   *
   * @example
   * ```ts
   * const file = await client.files.download('7c9e6679-7425-40de-944b-e07fc1f90ae7');
   * ```
   */
  download(
    fileID: string,
    query: FileDownloadParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<FileDownloadResponse> {
    return this._client.get(__scalarPath`/api/files/${fileID}/download`, { query, ...options });
  }
}

export interface FileInitiateUploadParams {
  purpose: 'attachment' | 'avatar' | 'banner' | 'server_icon' | 'emoji';
  /**
   * @minimum 1
   * @maximum 2147483647
   */
  sizeBytes: number;
  /**
   * @minimum 65536
   * @maximum 67108864
   */
  chunkSizeBytes?: number;
  encryptionMode?: 'e2ee-v1';
  /**
   * @minLength 1
   * @maxLength 255
   */
  mimeType?: string;
  /**
   * @minLength 1
   * @maxLength 255
   */
  originalName?: string;
  /**
   * @format uuid
   */
  serverId?: string;
}

export interface FileInitiateUploadResponse {
  /**
   * @format date-time
   */
  expiresAt: string;
  /**
   * @format uuid
   */
  fileId: string;
  /**
   * @minimum 5242880
   */
  partSizeBytes: number;
  parts: Array<FileInitiateUploadResponse.Part>;
  /**
   * @format uuid
   */
  uploadId: string;
}

export namespace FileInitiateUploadResponse {
  export interface Part {
    /**
     * @minimum 1
     * @maximum 10000
     */
    partNumber: number;
    url: string;
  }
}

export interface FilePresignUploadPartParams {
  /**
   * @minimum 1
   * @maximum 10000
   */
  partNumber: number;
}

export interface FilePresignUploadPartResponse {
  /**
   * @format date-time
   */
  expiresAt: string;
  url: string;
}

export interface FileCompleteUploadParams {
  /**
   * @minItems 1
   * @maxItems 10000
   */
  parts: Array<FileCompleteUploadParams.Part>;
}

export namespace FileCompleteUploadParams {
  export interface Part {
    /**
     * @minLength 1
     * @maxLength 512
     */
    etag: string;
    /**
     * @minimum 1
     * @maximum 10000
     */
    partNumber: number;
  }
}

export interface FileCompleteUploadResponse {
  /**
   * @format uuid
   */
  fileId: string;
  status: 'pending' | 'quarantined' | 'processing' | 'ready' | 'rejected' | 'deleted';
}

export interface FileAbortUploadResponse {
  /**
   * @format uuid
   */
  fileId: string;
  status: 'pending' | 'quarantined' | 'processing' | 'ready' | 'rejected' | 'deleted';
}

export interface FileRetrieveResponse {
  encryptionMode: 'none' | 'e2ee-v1';
  /**
   * @format date-time
   */
  createdAt: string;
  durationMs: number | null;
  height: number | null;
  /**
   * @format uuid
   */
  id: string;
  mimeType: string;
  originalName: string;
  purpose: 'attachment' | 'avatar' | 'banner' | 'server_icon' | 'emoji';
  rejectionReason: string | null;
  scanStatus: string;
  /**
   * @format uuid
   */
  serverId: string | null;
  /**
   * @minimum 0
   */
  sizeBytes: number;
  status: 'pending' | 'quarantined' | 'processing' | 'ready' | 'rejected' | 'deleted';
  variants: Array<FileRetrieveResponse.Variant>;
  width: number | null;
}

export namespace FileRetrieveResponse {
  export interface Variant {
    height: number | null;
    /**
     * @format uuid
     */
    id: string;
    mimeType: string;
    /**
     * @minimum 0
     */
    sizeBytes: number;
    type: string;
    width: number | null;
  }
}

export interface FileDownloadParams {
  /**
   * @minLength 1
   * @maxLength 64
   */
  variant?: string;
}

export interface FileDownloadResponse {
  /**
   * @format date-time
   */
  expiresAt: string;
  url: string;
}
export declare namespace Files {
  export {
    type FileInitiateUploadResponse as FileInitiateUploadResponse,
    type FilePresignUploadPartResponse as FilePresignUploadPartResponse,
    type FileCompleteUploadResponse as FileCompleteUploadResponse,
    type FileAbortUploadResponse as FileAbortUploadResponse,
    type FileRetrieveResponse as FileRetrieveResponse,
    type FileDownloadResponse as FileDownloadResponse,
    type FileInitiateUploadParams as FileInitiateUploadParams,
    type FilePresignUploadPartParams as FilePresignUploadPartParams,
    type FileCompleteUploadParams as FileCompleteUploadParams,
    type FileDownloadParams as FileDownloadParams,
  };
}
