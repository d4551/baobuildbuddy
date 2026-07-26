import type { Static } from "typebox";
export declare const openaiV1ChatMessageSchema: import("typebox").TObject<{
    role: import("typebox").TUnion<[import("typebox").TLiteral<"system">, import("typebox").TLiteral<"user">, import("typebox").TLiteral<"assistant">]>;
    content: import("typebox").TString;
}>;
export declare const openaiV1ChatCompletionsBodySchema: import("typebox").TObject<{
    model: import("typebox").TString;
    messages: import("typebox").TArray<import("typebox").TObject<{
        role: import("typebox").TUnion<[import("typebox").TLiteral<"system">, import("typebox").TLiteral<"user">, import("typebox").TLiteral<"assistant">]>;
        content: import("typebox").TString;
    }>>;
    temperature: import("typebox").TOptional<import("typebox").TNumber>;
    max_tokens: import("typebox").TOptional<import("typebox").TNumber>;
    stream: import("typebox").TOptional<import("typebox").TBoolean>;
}>;
export type OpenAIV1ChatCompletionsBody = Static<typeof openaiV1ChatCompletionsBodySchema>;
export declare const openaiV1ModelParamsSchema: import("typebox").TObject<{
    model: import("typebox").TString;
}>;
export type OpenAIV1ModelParams = Static<typeof openaiV1ModelParamsSchema>;
export declare const openaiV1ErrorBodySchema: import("typebox").TObject<{
    error: import("typebox").TObject<{
        message: import("typebox").TString;
        type: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    }>;
}>;
export declare const openaiV1ModelObjectSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    object: import("typebox").TLiteral<"model">;
    created: import("typebox").TNumber;
    owned_by: import("typebox").TString;
}>;
export declare const openaiV1ModelsListSchema: import("typebox").TObject<{
    object: import("typebox").TLiteral<"list">;
    data: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        object: import("typebox").TLiteral<"model">;
        created: import("typebox").TNumber;
        owned_by: import("typebox").TString;
    }>>;
}>;
export declare const openaiV1ModelsListResponses: {
    readonly 200: import("typebox").TObject<{
        object: import("typebox").TLiteral<"list">;
        data: import("typebox").TArray<import("typebox").TObject<{
            id: import("typebox").TString;
            object: import("typebox").TLiteral<"model">;
            created: import("typebox").TNumber;
            owned_by: import("typebox").TString;
        }>>;
    }>;
    readonly 401: import("typebox").TObject<{
        error: import("typebox").TObject<{
            message: import("typebox").TString;
            type: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        }>;
    }>;
};
export declare const openaiV1ModelGetResponses: {
    readonly 200: import("typebox").TObject<{
        id: import("typebox").TString;
        object: import("typebox").TLiteral<"model">;
        created: import("typebox").TNumber;
        owned_by: import("typebox").TString;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TObject<{
            message: import("typebox").TString;
            type: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        }>;
    }>;
    readonly 401: import("typebox").TObject<{
        error: import("typebox").TObject<{
            message: import("typebox").TString;
            type: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        }>;
    }>;
};
