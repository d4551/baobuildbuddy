import type { AIChatContextDomain, ChatMessage } from "@bao/shared/types/ai";
import type { BrandSettings } from "@bao/shared/types/settings-contracts";
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
    buildContext(sessionId: string, currentMessage: string, preferredDomain?: AIChatContextDomain, runtimeBrand?: BrandSettings | null): Promise<ConversationContext>;
    /**
     * Loads recent conversation history and appends the current user message once.
     */
    private loadConversationMessages;
    /**
     * Loads the default user profile row when available.
     */
    private loadDefaultProfile;
    /**
     * Builds the final system prompt from the selected domain and user context.
     */
    private buildSystemPrompt;
    /**
     * Load domain-specific data from DB
     */
    private loadDomainContext;
    private getDomainContextLoader;
    private loadResumeContext;
    private loadJobSearchContext;
    private loadInterviewContext;
    private loadPortfolioContext;
    private loadSkillsContext;
    private loadAutomationContext;
    /**
     * Generate follow-up suggestions based on domain and last response
     */
    generateFollowUps(domain: AIChatContextDomain): string[];
}
export declare const contextManager: ConversationContextManager;
export {};
