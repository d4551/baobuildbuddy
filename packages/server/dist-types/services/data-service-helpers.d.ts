export declare const runWithErrorHandler: (operation: () => Promise<void>, onError: (message: string) => void) => Promise<void>;
export declare const runIgnoringErrors: (operation: () => Promise<void>) => Promise<void>;
export declare const runTasksSequentially: (tasks: Array<() => Promise<void>>, index?: number) => Promise<void>;
