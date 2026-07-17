import { type AIProviderType } from "@bao/shared/types/ai";
import type { OpenAIV1ChatCompletionsBody } from "./openai-v1-route-contracts";
export type OpenAIV1ModelRecord = {
    id: string;
    object: "model";
    created: number;
    owned_by: string;
};
export declare const toOpenAIV1Error: (message: string, type?: string, code?: string | null) => {
    error: {
        message: string;
        type: string;
        code: string | null;
    };
};
export declare const buildOpenAIV1ModelId: (provider: AIProviderType, model: string) => string;
export declare const parseOpenAIV1ModelId: (modelId: string) => {
    provider: AIProviderType | null;
    model: string;
};
export declare const listOpenAIV1Models: () => Promise<OpenAIV1ModelRecord[]>;
export declare const getOpenAIV1Model: (modelId: string) => Promise<{
    status: 200;
    body: OpenAIV1ModelRecord;
} | {
    status: 404;
    body: {
        error: {
            message: string;
            type: string;
            code: string | null;
        };
    };
}>;
export declare const createOpenAIV1ChatCompletion: (body: OpenAIV1ChatCompletionsBody) => Promise<{
    status: 200;
    body: {
        id: string;
        object: "chat.completion";
        created: number;
        model: string;
        choices: {
            index: number;
            message: {
                role: "assistant";
                content: string;
            };
            finish_reason: "stop";
        }[];
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
} | {
    status: 404;
    body: {
        error: {
            message: string;
            type: string;
            code: string | null;
        };
    };
} | {
    status: 500;
    body: {
        error: {
            message: string;
            type: string;
            code: string | null;
        };
    };
}>;
export declare const createOpenAIV1ChatCompletionStream: (body: OpenAIV1ChatCompletionsBody) => Promise<Response>;
