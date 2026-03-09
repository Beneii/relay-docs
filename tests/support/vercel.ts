export function createMockResponse() {
  let statusCode = 200;
  let jsonBody: unknown;
  let sentBody: unknown;
  const headers = new Map<string, string>();

  return {
    get statusCode() {
      return statusCode;
    },
    get jsonBody() {
      return jsonBody;
    },
    get sentBody() {
      return sentBody;
    },
    headers,
    setHeader(name: string, value: string) {
      headers.set(name, value);
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: unknown) {
      jsonBody = body;
      return this;
    },
    send(body: unknown) {
      sentBody = body;
      return this;
    },
    end() {
      return this;
    },
  };
}

export function createMockRequest<TBody = unknown>(input: {
  method: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: TBody;
}) {
  return {
    method: input.method,
    headers: input.headers ?? {},
    body: input.body,
  };
}
