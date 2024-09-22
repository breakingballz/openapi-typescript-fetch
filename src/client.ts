import type { Client, Fetch, ReqInit, Resp } from "./types";

export function buildUrl({
  origin,
  base,
  pathname,
  params,
}: {
  origin: string;
  base: string;
  pathname: string;
  params: ReqInit["params"];
}): URL {
  let parsedPathname = `${base === "/" ? "" : base}${pathname}`;

  if (params?.path) {
    Object.entries(params.path).forEach(
      ([key, val]) =>
        (parsedPathname = parsedPathname.replaceAll(`{${key}}`, encodeURI(String(val)))),
    );
  }

  const url = new URL(parsedPathname, origin);

  if (params?.query) {
    Object.entries(params.query).forEach(([key, val]) => {
      if (val !== undefined) {
        url.searchParams.set(key, String(val));
      }
    });
  }

  return url;
}

export function buildHeaders({
  headers,
  params,
  contentType,
}: {
  headers: RequestInit["headers"];
  params: ReqInit["params"];
  contentType?: string;
}): Headers {
  const result = new Headers(headers);

  if (params?.header) {
    Object.entries(params.header).forEach(([key, val]) => {
      if (val !== undefined) {
        result.append(key, String(val));
      }
    });
  }

  if (params?.cookie) {
    Object.entries(params.cookie).forEach(([key, val]) => {
      if (val !== undefined) {
        result.append("cookie", `${key}=${val}`);
      }
    });
  }

  if (contentType) {
    result.set("content-type", contentType);
  }

  return result;
}

export function buildBody(data: unknown | undefined): string | undefined {
  return data === undefined ? undefined : JSON.stringify(data);
}

export function createClient<Paths>({
  baseUrl,
  fetch: fetchClient = fetch,
}: {
  baseUrl: string | URL;
  fetch?: Fetch;
}): Client<Paths> {
  const { origin, pathname: base } = new URL(baseUrl);

  return async (input, { params, body, headers: reqHeaders, ...init }: ReqInit) => {
    const url = buildUrl({ origin, base, pathname: input as string, params });
    const resp = await fetchClient(url, {
      ...init,
      headers: buildHeaders({
        headers: reqHeaders,
        params,
        contentType: body?.contentType,
      }),
      body: buildBody(body?.data),
    });

    let respHeaders: Resp["headers"] | undefined;

    return {
      arrayBuffer: resp.arrayBuffer.bind(resp),
      blob: resp.blob.bind(resp),
      body: resp.body,
      get bodyUsed() {
        return resp.bodyUsed;
      },
      clone: resp.clone.bind(resp),
      contentType: resp.headers.get("content-type") as string,
      get headers() {
        respHeaders = respHeaders ?? {
          append: resp.headers.append.bind(resp.headers),
          delete: resp.headers.delete.bind(resp.headers),
          entries: resp.headers.entries.bind(resp.headers),
          forEach: resp.headers.forEach.bind(resp.headers),
          get: resp.headers.get.bind(resp.headers),
          getSetCookie: resp.headers.getSetCookie.bind(resp.headers),
          has: resp.headers.has.bind(resp.headers),
          keys: resp.headers.keys.bind(resp.headers),
          set: resp.headers.set.bind(resp.headers),
          values: resp.headers.values.bind(resp.headers),
          typed: new Proxy(
            {},
            {
              get: (_, key: string) => resp.headers.get(key),
            },
          ),
          [Symbol.iterator]: resp.headers[Symbol.iterator].bind(resp.headers),
        };

        return respHeaders;
      },
      json: resp.json.bind(resp),
      ok: resp.ok,
      redirected: resp.redirected,
      status: resp.status,
      statusText: resp.statusText,
      text: resp.text.bind(resp),
      type: resp.type,
      url: resp.url,
      formData: resp.formData.bind(resp),
    } satisfies Resp as never;
  };
}
