import { NotifyOptions, NotifyResponse, RelayConfig, RelayRequestBody } from './types.js';

export const DEFAULT_ENDPOINT =
  'https://relayapp.dev/webhook';
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;

export class RelayError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'RelayError';
    this.statusCode = statusCode;
  }
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateOptions(options: NotifyOptions) {
  if (!options || typeof options.title !== 'string' || options.title.trim().length === 0) {
    throw new RelayError('Notification title is required');
  }
}

function buildRequestBody(options: NotifyOptions): RelayRequestBody {
  const body: RelayRequestBody = {
    title: options.title,
  };

  if (options.body !== undefined) {
    body.body = options.body;
  }
  if (options.eventType !== undefined) {
    body.eventType = options.eventType;
  }
  if (options.metadata !== undefined) {
    body.metadata = options.metadata;
  }
  if (options.url !== undefined) {
    body.url = options.url;
  }
  if (options.actions !== undefined) {
    body.actions = options.actions;
  }
  if (options.severity !== undefined) {
    body.severity = options.severity;
  }
  if (options.channel !== undefined) {
    body.channel = options.channel;
  }

  return body;
}

function mapErrorMessage(status: number, fallback?: string): string {
  if (status === 401) {
    return 'Invalid token. Get your webhook token at relayapp.dev/dashboard';
  }
  if (status === 429) {
    return 'Monthly notification limit reached. Upgrade at relayapp.dev/pricing';
  }
  return fallback || 'Relay request failed';
}

async function parseJson(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new RelayError(
      `Relay returned an unexpected response (HTTP ${response.status})`,
      response.status || undefined
    );
  }
}

export class Relay {
  private readonly token: string;
  private readonly endpoint: string;

  constructor(config: RelayConfig) {
    if (!config?.token) {
      throw new RelayError('Relay token is required');
    }
    if (!/^[a-f0-9]{64}$/.test(config.token)) {
      throw new RelayError(
        'Invalid token format. Relay tokens are 64-character hex strings. Get your token at relayapp.dev/dashboard'
      );
    }
    this.token = config.token;
    this.endpoint = config.endpoint || DEFAULT_ENDPOINT;
  }

  static async notify(token: string, options: NotifyOptions, endpoint?: string) {
    const relay = new Relay({ token, endpoint });
    return relay.notify(options);
  }

  async notify(options: NotifyOptions): Promise<NotifyResponse> {
    validateOptions(options);
    const payload = buildRequestBody(options);
    const response = await this.postWithRetry(payload);
    const data = (await parseJson(response)) as NotifyResponse | { error?: string } | null;

    if (!response.ok || !data || 'success' in data === false) {
      const errorMessage = mapErrorMessage(response.status, data && 'error' in data ? data.error : undefined);
      throw new RelayError(errorMessage, response.status);
    }

    return data as NotifyResponse;
  }

  private buildRequestUrl(): string {
    const normalized = this.endpoint.replace(/\/+$/, '');
    return `${normalized}/${this.token}`;
  }

  private async postWithRetry(payload: RelayRequestBody): Promise<Response> {
    const body = JSON.stringify(payload);
    const url = this.buildRequestUrl();

    for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body,
          signal: controller.signal,
        });

        if (!response.ok && response.status >= 400 && response.status < 500) {
          // Do not retry on 4xx errors
          return response;
        }

        if (response.status >= 500 && attempt < RETRY_ATTEMPTS) {
          await delay(RETRY_DELAY_MS);
          continue;
        }

        return response;
      } catch (error) {
        if (attempt === RETRY_ATTEMPTS) {
          const message = error instanceof Error ? error.message : 'Unknown network error';
          throw new RelayError(`Network error while contacting Relay: ${message}`);
        }
        await delay(RETRY_DELAY_MS);
      } finally {
        clearTimeout(timer);
      }
    }

    throw new RelayError('Unable to contact Relay');
  }
}
