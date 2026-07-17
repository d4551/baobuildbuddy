export declare const userRoutes: import("elysia/types").AddRoute<string, "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {
        [x: string]: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        name: string;
                        email: string | null;
                        phone: string | null;
                        location: string | null;
                        website: string | null;
                        linkedin: string | null;
                        github: string | null;
                        summary: string | null;
                        currentRole: string | null;
                        currentCompany: string | null;
                        yearsExperience: number | null;
                        technicalSkills: string[];
                        softSkills: string[];
                        gamingExperience: Record<string, unknown>;
                        careerGoals: Record<string, unknown>;
                        createdAt: string;
                        updatedAt: string;
                    };
                    400: {
                        error: string;
                        code?: string | undefined;
                        fields?: string[] | undefined;
                    };
                    404: {
                        error: string;
                        code?: string | undefined;
                        fields?: string[] | undefined;
                    };
                    422: {
                        error: string;
                        code?: string | undefined;
                        fields?: string[] | undefined;
                    };
                    500: {
                        error: string;
                        code?: string | undefined;
                        fields?: string[] | undefined;
                    };
                };
                error: never;
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "put", string, import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    body: import("typebox").TObject<{
        name: import("typebox").TOptional<import("typebox").TString>;
        email: import("typebox").TOptional<import("typebox").TString>;
        phone: import("typebox").TOptional<import("typebox").TString>;
        location: import("typebox").TOptional<import("typebox").TString>;
        website: import("typebox").TOptional<import("typebox").TString>;
        linkedin: import("typebox").TOptional<import("typebox").TString>;
        github: import("typebox").TOptional<import("typebox").TString>;
        summary: import("typebox").TOptional<import("typebox").TString>;
        currentRole: import("typebox").TOptional<import("typebox").TString>;
        currentCompany: import("typebox").TOptional<import("typebox").TString>;
        yearsExperience: import("typebox").TOptional<import("typebox").TNumber>;
        technicalSkills: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        softSkills: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        gamingExperience: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        careerGoals: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    }>;
    response: {
        400: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>;
        404: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>;
        422: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>;
        500: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>;
        200: import("typebox").TObject<{
            id: import("typebox").TString;
            name: import("typebox").TString;
            email: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            phone: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            website: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            linkedin: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            github: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            summary: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            currentRole: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            currentCompany: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            yearsExperience: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
            technicalSkills: import("typebox").TArray<import("typebox").TString>;
            softSkills: import("typebox").TArray<import("typebox").TString>;
            gamingExperience: import("typebox").TRecord<"^.*$", import("typebox").TUnknown>;
            careerGoals: import("typebox").TRecord<"^.*$", import("typebox").TUnknown>;
            createdAt: import("typebox").TString;
            updatedAt: import("typebox").TString;
        }>;
    };
}, {}, `${string}/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ body, status }: {
    body: {
        name?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        location?: string | undefined;
        website?: string | undefined;
        linkedin?: string | undefined;
        github?: string | undefined;
        summary?: string | undefined;
        currentRole?: string | undefined;
        currentCompany?: string | undefined;
        yearsExperience?: number | undefined;
        technicalSkills?: string[] | undefined;
        softSkills?: string[] | undefined;
        gamingExperience?: Record<string, unknown> | undefined;
        careerGoals?: Record<string, unknown> | undefined;
    };
    query: Record<string, string | undefined>;
    params: {};
    headers: Record<string, string | undefined>;
    cookie: Record<string, import("elysia").Cookie<unknown>>;
    server: import("elysia").Server | null;
    redirect: import("elysia").redirect;
    set: {
        headers: import("elysia").HTTPHeaders;
        status?: number | keyof import("elysia").StatusMap;
        cookie?: Record<string, import("elysia").BaseCookie>;
    };
    readonly path: string;
    route?: string;
    rid?: string;
    request: Request;
    store: {};
    status: import("elysia").SelectiveStatus<{
        400: {
            error: string;
            code?: string | undefined;
            fields?: string[] | undefined;
        };
        404: {
            error: string;
            code?: string | undefined;
            fields?: string[] | undefined;
        };
        422: {
            error: string;
            code?: string | undefined;
            fields?: string[] | undefined;
        };
        500: {
            error: string;
            code?: string | undefined;
            fields?: string[] | undefined;
        };
        200: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            location: string | null;
            website: string | null;
            linkedin: string | null;
            github: string | null;
            summary: string | null;
            currentRole: string | null;
            currentCompany: string | null;
            yearsExperience: number | null;
            technicalSkills: string[];
            softSkills: string[];
            gamingExperience: Record<string, unknown>;
            careerGoals: Record<string, unknown>;
            createdAt: string;
            updatedAt: string;
        };
    }>;
}) => Promise<import("elysia").ElysiaStatus<200, {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    website: string | null;
    linkedin: string | null;
    github: string | null;
    summary: string | null;
    currentRole: string | null;
    currentCompany: string | null;
    yearsExperience: number | null;
    technicalSkills: string[];
    softSkills: string[];
    gamingExperience: Record<string, unknown>;
    careerGoals: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}, 200>>>;
