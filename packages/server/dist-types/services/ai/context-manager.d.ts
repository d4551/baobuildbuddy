import type { AIChatContextDomain, ChatMessage } from "@bao/shared";
interface ConversationContext {
    systemPrompt: string;
    messages: Array<Pick<ChatMessage, "role" | "content">>;
}
export declare class ConversationContextManager {
    private isChatRole;
    /**
     * Auto-detect domain from message content
     */
    inferDomain(message: string): AIChatContextDomain;
    /**
     * Build full context for AI call with conversation history and domain-specific data
     */
    buildContext(sessionId: string, currentMessage: string, preferredDomain?: AIChatContextDomain): Promise<ConversationContext>;
    /**
     * Load domain-specific data from DB
     */
    private loadDomainContext;
    /**
     * Generate follow-up suggestions based on domain and last response
     */
    generateFollowUps(domain: AIChatContextDomain): string[];
}
export declare const contextManager: ConversationContextManager;
export {};
