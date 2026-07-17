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
export declare const openaiV1ChatChoiceSchema: import("typebox").TObject<{
    index: import("typebox").TNumber;
    message: import("typebox").TObject<{
        role: import("typebox").TLiteral<"assistant">;
        content: import("typebox").TString;
    }>;
    finish_reason: import("typebox").TUnion<[import("typebox").TLiteral<"stop">, import("typebox").TLiteral<"length">, import("typebox").TNull]>;
}>;
export declare const openaiV1ChatCompletionSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    object: import("typebox").TLiteral<"chat.completion">;
    created: import("typebox").TNumber;
    model: import("typebox").TString;
    choices: import("typebox").TArray<import("typebox").TObject<{
        index: import("typebox").TNumber;
        message: import("typebox").TObject<{
            role: import("typebox").TLiteral<"assistant">;
            content: import("typebox").TString;
        }>;
        finish_reason: import("typebox").TUnion<[import("typebox").TLiteral<"stop">, import("typebox").TLiteral<"length">, import("typebox").TNull]>;
    }>>;
    usage: import("typebox").TObject<{
        prompt_tokens: import("typebox").TNumber;
        completion_tokens: import("typebox").TNumber;
        total_tokens: import("typebox").TNumber;
    }>;
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
export declare const openaiV1ChatCompletionsResponses: {
    readonly 200: import("typebox").TObject<{
        id: import("typebox").TString;
        object: import("typebox").TLiteral<"chat.completion">;
        created: import("typebox").TNumber;
        model: import("typebox").TString;
        choices: import("typebox").TArray<import("typebox").TObject<{
            index: import("typebox").TNumber;
            message: import("typebox").TObject<{
                role: import("typebox").TLiteral<"assistant">;
                content: import("typebox").TString;
            }>;
            finish_reason: import("typebox").TUnion<[import("typebox").TLiteral<"stop">, import("typebox").TLiteral<"length">, import("typebox").TNull]>;
        }>>;
        usage: import("typebox").TObject<{
            prompt_tokens: import("typebox").TNumber;
            completion_tokens: import("typebox").TNumber;
            total_tokens: import("typebox").TNumber;
        }>;
    }>;
    readonly 400: import("typebox").TObject<{
        error: import("typebox").TObject<{
            message: import("typebox").TString;
            type: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        }>;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TObject<{
            message: import("typebox").TString;
            type: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        }>;
    }>;
    readonly 500: import("typebox").TObject<{
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
