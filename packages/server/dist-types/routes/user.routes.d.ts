import { Elysia } from "elysia";
export declare const userRoutes: Elysia<string, {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
}, {
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
                        technicalSkills: string[] | null;
                        softSkills: string[] | null;
                        gamingExperience: Record<string, unknown> | null;
                        careerGoals: Record<string, unknown> | null;
                        createdAt: string;
                        updatedAt: string;
                    } | {
                        id: string;
                        name: string;
                        technicalSkills: never[];
                        softSkills: never[];
                        gamingExperience: {};
                        careerGoals: {};
                    };
                };
            };
        };
    };
} & {
    [x: string]: {
        [x: string]: {
            put: {
                body: {} & {
                    careerGoals?: Record<string, unknown> | undefined;
                    currentCompany?: string | undefined;
                    currentRole?: string | undefined;
                    email?: string | undefined;
                    gamingExperience?: Record<string, unknown> | undefined;
                    github?: string | undefined;
                    linkedin?: string | undefined;
                    location?: string | undefined;
                    name?: string | undefined;
                    phone?: string | undefined;
                    softSkills?: string[] | undefined;
                    summary?: string | undefined;
                    technicalSkills?: string[] | undefined;
                    website?: string | undefined;
                    yearsExperience?: number | undefined;
                };
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
                        technicalSkills: string[] | null;
                        softSkills: string[] | null;
                        gamingExperience: Record<string, unknown> | null;
                        careerGoals: Record<string, unknown> | null;
                        createdAt: string;
                        updatedAt: string;
                    };
                    422: {
                        type: 'validation';
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
