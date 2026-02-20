import type { ChatMessage } from "@bao/shared";
type ContextDomain = "resume" | "job_search" | "interview" | "portfolio" | "skills" | "automation" | "general";
interface ConversationContext {
    systemPrompt: string;
    messages: Array<Pick<ChatMessage, "role" | "content">>;
}
export declare class ConversationContextManager {
    private isChatRole;
    /**
     * Auto-detect domain from message content
     */
    inferDomain(message: string): ContextDomain;
    /**
     * Build full context for AI call with conversation history and domain-specific data
     */
    buildContext(sessionId: string, currentMessage: string): Promise<ConversationContext>;
    /**
     * Load domain-specific data from DB
     */
    private loadDomainContext;
    /**
     * Generate follow-up suggestions based on domain and last response
     */
    generateFollowUps(domain: ContextDomain): string[];
}
export declare const contextManager: ConversationContextManager;
export {};
