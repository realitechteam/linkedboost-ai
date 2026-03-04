export interface ProfileData {
    linkedInId: string;
    name: string;
    headline: string;
    about: string;
    profileUrl: string;
    location?: string;
    connections?: string;
    experience: Array<{
        title?: string;
        company?: string;
        duration?: string;
    }>;
    education: Array<{
        school?: string;
        degree?: string;
    }>;
    skills: string[];
    extractedAt: number;
}
export interface MessageContext {
    senderName: string;
    messages: Array<{
        sender: string;
        text: string;
        isOwn: boolean;
    }>;
    conversationUrl: string;
}
export interface JobDetails {
    title: string;
    company: string;
    description: string;
    jobUrl: string;
    extractedAt: number;
}
export interface RateLimitStatus {
    canProceed: boolean;
    waitTime?: number;
    message?: string;
}
export interface LinkedInSessionStatus {
    isLoggedIn: boolean;
    profileUrl?: string;
    userName?: string;
}
/**
 * Generate random delay between min and max for human-like behavior
 */
export declare function getRandomDelay(min?: number, max?: number): number;
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Try multiple selectors and return first match
 */
export declare function queryWithFallback(selectors: string[]): Element | null;
/**
 * Get text content from element using fallback selectors
 */
export declare function getTextWithFallback(selectors: string[]): string;
/**
 * Check if user is logged into LinkedIn
 * Detects by checking for logged-in UI elements
 */
export declare function checkLinkedInLoginStatus(): LinkedInSessionStatus;
/**
 * Check if currently viewing own profile
 */
export declare function isOwnProfile(): boolean;
/**
 * Check if profile sync is allowed based on rate limits
 */
export declare function canSyncProfile(): Promise<RateLimitStatus>;
/**
 * Record profile sync timestamp
 */
export declare function recordProfileSync(): Promise<void>;
/**
 * Check if reply suggestion is allowed based on rate limits
 */
export declare function canSuggestReply(): Promise<RateLimitStatus>;
/**
 * Record reply suggestion usage
 */
export declare function recordReplySuggestion(): Promise<void>;
/**
 * Extract LinkedIn ID from profile URL
 * URL format: linkedin.com/in/username or linkedin.com/in/username/
 */
export declare function extractLinkedInId(url: string): string;
/**
 * Get the currently logged-in user's profile URL
 */
export declare function getOwnProfileUrl(): string | null;
/**
 * Navigate to own profile page
 */
export declare function navigateToOwnProfile(): void;
/**
 * Extract profile data from current LinkedIn profile page
 */
export declare function extractProfileData(): Promise<ProfileData>;
/**
 * Extract message context from current conversation
 */
export declare function extractMessageContext(): Promise<MessageContext | null>;
/**
 * Extract job details from current job posting page
 */
export declare function extractJobDetails(): Promise<JobDetails | null>;
export declare const LinkedInAPI: {
    checkLinkedInLoginStatus: typeof checkLinkedInLoginStatus;
    isOwnProfile: typeof isOwnProfile;
    canSyncProfile: typeof canSyncProfile;
    recordProfileSync: typeof recordProfileSync;
    canSuggestReply: typeof canSuggestReply;
    recordReplySuggestion: typeof recordReplySuggestion;
    extractProfileData: typeof extractProfileData;
    extractMessageContext: typeof extractMessageContext;
    extractJobDetails: typeof extractJobDetails;
    getRandomDelay: typeof getRandomDelay;
    sleep: typeof sleep;
    queryWithFallback: typeof queryWithFallback;
    getTextWithFallback: typeof getTextWithFallback;
    RATE_LIMIT: {
        PROFILE_SYNC_INTERVAL: number;
        REPLY_SUGGEST_INTERVAL: number;
        MAX_REPLIES_PER_HOUR: number;
        EXTRACTION_DELAY_MIN: number;
        EXTRACTION_DELAY_MAX: number;
    };
    SELECTORS: {
        profile: {
            container: string[];
            name: string[];
            headline: string[];
            about: string[];
            location: string[];
            connections: string[];
            experienceSection: string;
            educationSection: string;
            skillsSection: string;
            experienceAlt: string;
            educationAlt: string;
            skillsAlt: string;
        };
        messaging: {
            input: string;
            conversationList: string;
            messageItem: string;
            senderName: string;
            messageText: string;
        };
        job: {
            container: string;
            title: string;
            company: string;
            description: string;
            requirements: string;
        };
        ownProfileIndicators: string[];
    };
};
export default LinkedInAPI;
//# sourceMappingURL=linkedinApi.d.ts.map