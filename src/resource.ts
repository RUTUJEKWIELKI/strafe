// File generated from our OpenAPI spec by Scalar. See README.md for details.

import type { StrafeBotAPI } from './client';

export abstract class APIResource {
  protected _client: StrafeBotAPI;

  constructor(client: StrafeBotAPI) {
    this._client = client;
  }
}
