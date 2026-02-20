import { Elysia } from "elysia";
export declare const userRoutes: Elysia<"/user", {
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
    user: {
        profile: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        name: string;
                        technicalSkills: never[];
                        softSkills: never[];
                        gamingExperience: {};
                        careerGoals: {};
                    } | {
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
                };
            };
        };
    };
} & {
    user: {
        profile: {
            put: {
                body: {
                    website?: string | undefined;
                    name?: string | undefined;
                    email?: string | undefined;
                    phone?: string | undefined;
                    location?: string | undefined;
                    github?: string | undefined;
                    linkedin?: string | undefined;
                    summary?: string | undefined;
                    currentRole?: string | undefined;
                    currentCompany?: string | undefined;
                    yearsExperience?: number | undefined;
                    technicalSkills?: string[] | undefined;
                    softSkills?: string[] | undefined;
                    gamingExperience?: {} | undefined;
                    careerGoals?: {} | undefined;
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
                        type: "validation";
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
