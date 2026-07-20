type ApiError = unknown;

export interface ApiEnvelope<TData = unknown> {
  data: TData | null;
  error: ApiError;
}

type ApiRequest<TData = unknown> = Promise<ApiEnvelope<TData>>;
type JsonRecord = object;

export interface JobsQueryRequest {
  query?: Record<string, string>;
}

export interface StudioAnalyticsApi {
  get(): ApiRequest<unknown>;
}

export interface JobsSaveRoute {
  post(body: { jobId: string }): ApiRequest<unknown>;
  (params: {
    jobId: string;
  }): {
    delete(): ApiRequest<unknown>;
  };
}

export interface JobsApplyRoute {
  post(body: { jobId: string; notes?: string }): ApiRequest<unknown>;
  (params: {
    id: string;
  }): {
    put(body: { status: string }): ApiRequest<unknown>;
  };
}

export interface JobsApi {
  get(options?: JobsQueryRequest): ApiRequest<unknown>;
  (params: {
    id: string;
  }): {
    get(): ApiRequest<unknown>;
  };
  saved: {
    get(): ApiRequest<unknown>;
  };
  save: JobsSaveRoute;
  applications: {
    get(): ApiRequest<unknown>;
  };
  apply: JobsApplyRoute;
  refresh: {
    post(): ApiRequest<unknown>;
  };
  recommendations: {
    get(): ApiRequest<unknown>;
  };
}

export interface StudiosApi {
  get(options?: JobsQueryRequest): ApiRequest<unknown>;
  post(body: JsonRecord): ApiRequest<unknown>;
  analytics: StudioAnalyticsApi;
  (params: {
    id: string;
  }): {
    get(): ApiRequest<unknown>;
    put(body: JsonRecord): ApiRequest<unknown>;
    delete(): ApiRequest<unknown>;
  };
}
