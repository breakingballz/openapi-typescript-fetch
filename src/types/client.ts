import type { HttpMethod } from "./common";
import type { Merge, Optionalize } from "./utils";

type ResponseObject = { headers?: Record<string, unknown>; content?: Record<string, unknown> };

type ResponsesObject = {
  [key in "default" | `${1 | 2 | 3 | 4 | 5}XX`]?: ResponseObject;
} & {
  [key: number]: ResponseObject;
};

type ReqBody<T> = T extends { requestBody?: { content: infer Content } }
  ? { [key in keyof Content]: { contentType: key; data: Content[key] } }[keyof Content]
  : undefined;

type ReqParams<PathItem, Operation> = Merge<PathItem, Operation> extends {
  parameters?: infer Params;
}
  ? Params
  : undefined;

type RespBody<T> = T extends { responses: infer Responses extends ResponsesObject }
  ? {
      [status in keyof Responses]: {
        status: status;
        headers: {
          typed: Responses[status] extends { headers?: infer Headers } ? Headers : unknown;
        };
      } & (Responses[status] extends {
        content?: infer ContentTypes extends Record<string, unknown>;
      }
        ? {
            [contentType in keyof ContentTypes]: {
              contentType: contentType;
              json(): Promise<ContentTypes[contentType]>;
            };
          }[keyof ContentTypes]
        : unknown);
    }[keyof Responses]
  : unknown;

export type ReqInit = Omit<RequestInit, "body"> & {
  body?: {
    contentType: string;
    data: unknown;
  };
  params?: Partial<Record<"query" | "header" | "path" | "cookie", Record<string, unknown>>>;
};

export type Resp = Response & {
  readonly contentType: string;
  headers: Response["headers"] & { typed: Record<string, unknown> };
};

export type Client<Paths> = <
  Input extends keyof Paths,
  Method extends Extract<keyof Paths[Input], HttpMethod>,
>(
  input: Input,
  init: { method: Method } & (Omit<RequestInit, "method" | "body"> &
    Optionalize<{
      body: ReqBody<Paths[Input][Method]>;
      params: ReqParams<Paths[Input], Paths[Input][Method]>;
    }> extends infer Out
    ? { [key in keyof Out]: Out[key] }
    : unknown),
) => Promise<Omit<Response, "status" | "json"> & RespBody<Paths[Input][Method]>>;
