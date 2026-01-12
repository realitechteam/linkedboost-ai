// User types
export interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    linkedinId?: string;
    subscription?: Subscription;
    createdAt: Date;
    updatedAt: Date;
}

// Subscription types
export type Plan = 'FREE' | 'PRO' | 'PREMIUM';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE';

export interface Subscription {
    id: string;
    userId: string;
    plan: Plan;
    status: SubscriptionStatus;
    stripeId?: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
}

// LinkedIn Profile types
export interface LinkedInProfile {
    id: string;
    userId: string;
    profileUrl: string;
    headline?: string;
    about?: string;
    experience?: Experience[];
    education?: Education[];
    skills?: string[];
    lastScore?: number;
    lastAnalysis?: ProfileAnalysis;
}

export interface Experience {
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    description?: string;
}

export interface Education {
    school: string;
    degree?: string;
    field?: string;
    startYear?: number;
    endYear?: number;
}

// Profile Analysis types
export interface ProfileAnalysis {
    overallScore: number;
    sections: {
        photo: SectionScore;
        headline: SectionScore;
        about: SectionScore;
        experience: SectionScore;
        skills: SectionScore;
        other: SectionScore;
    };
    suggestions: ProfileSuggestion[];
}

export interface SectionScore {
    score: number;
    maxScore: number;
    feedback: string[];
}

export interface ProfileSuggestion {
    section: string;
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    example?: string;
}

// Post types
export type PostTone = 'professional' | 'casual' | 'inspirational' | 'educational';
export type PostFormat = 'story' | 'tips' | 'announcement' | 'question' | 'carousel';
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface PostDraft {
    id: string;
    userId: string;
    topic: string;
    content: string;
    tone: PostTone;
    format: PostFormat;
    hashtags: string[];
    status: PostStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface PostGenerateRequest {
    topic: string;
    tone: PostTone;
    format: PostFormat;
    keywords?: string[];
    language?: 'en' | 'vi';
}

export interface PostGenerateResponse {
    posts: {
        content: string;
        hashtags: string[];
    }[];
}

// Reply Suggestion types
export type ReplyTone = 'professional' | 'friendly' | 'concise';

export interface ReplySuggestRequest {
    conversationContext: string;
    senderName?: string;
    tone?: ReplyTone;
    language?: 'en' | 'vi';
}

export interface ReplySuggestResponse {
    suggestions: string[];
}

// Job Match types
export interface JobMatch {
    id: string;
    userId: string;
    jobUrl: string;
    jobTitle: string;
    company: string;
    matchScore: number;
    analysis: JobMatchAnalysis;
    createdAt: Date;
}

export interface JobMatchAnalysis {
    overallScore: number;
    categories: {
        skills: CategoryMatch;
        experience: CategoryMatch;
        education: CategoryMatch;
        softSkills: CategoryMatch;
    };
    recommendations: string[];
}

export interface CategoryMatch {
    score: number;
    matched: string[];
    missing: string[];
}

export interface JobMatchRequest {
    profileId: string;
    jobUrl: string;
}

// API Response types
export interface ApiResponse<T> {
    success: true;
    data: T;
    meta?: {
        usage?: UsageInfo;
    };
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

export interface UsageInfo {
    feature: Feature;
    used: number;
    limit: number;
    remaining: number;
}

export type Feature = 'REPLY_SUGGEST' | 'POST_GENERATE' | 'PROFILE_ANALYZE' | 'JOB_MATCH';

// Usage limits by plan
export const USAGE_LIMITS: Record<Plan, Record<Feature, number>> = {
    FREE: {
        REPLY_SUGGEST: 5,
        POST_GENERATE: 3,
        PROFILE_ANALYZE: 1,
        JOB_MATCH: 3,
    },
    PRO: {
        REPLY_SUGGEST: -1, // unlimited
        POST_GENERATE: 20,
        PROFILE_ANALYZE: -1,
        JOB_MATCH: 20,
    },
    PREMIUM: {
        REPLY_SUGGEST: -1,
        POST_GENERATE: -1,
        PROFILE_ANALYZE: -1,
        JOB_MATCH: -1,
    },
};
