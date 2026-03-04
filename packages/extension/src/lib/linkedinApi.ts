// LinkedIn API Helper Module for LinkedBoost AI Extension
// Provides legal data access through DOM extraction and session detection

// ==================== CONSTANTS ====================

const RATE_LIMIT = {
    PROFILE_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes between profile syncs
    REPLY_SUGGEST_INTERVAL: 6 * 1000, // 6 seconds between reply suggestions
    MAX_REPLIES_PER_HOUR: 10,
    EXTRACTION_DELAY_MIN: 1000, // 1 second minimum delay
    EXTRACTION_DELAY_MAX: 3000, // 3 seconds maximum delay
};

// LinkedIn DOM Selectors with fallbacks for different UI versions
const SELECTORS = {
    // Profile page selectors
    profile: {
        container: ['.pv-top-card', '.scaffold-layout__main'],
        name: [
            '.pv-top-card--list .text-heading-xlarge',
            'h1.text-heading-xlarge',
            '.pv-text-details__left-panel h1',
            'h1[class*="text-heading"]',
        ],
        headline: [
            '.pv-top-card--list .text-body-medium',
            '.text-body-medium.break-words',
            '.pv-text-details__left-panel .text-body-medium',
            'div.text-body-medium[data-generated-suggestion-target]',
        ],
        about: [
            '#about ~ .display-flex .inline-show-more-text span[aria-hidden="true"]',
            '#about ~ .display-flex .pv-shared-text-with-see-more span[aria-hidden="true"]',
            '#about + .display-flex span[aria-hidden="true"]',
            '.pv-about-section .pv-about__summary-text',
            'section[data-section="summary"] span[aria-hidden="true"]',
        ],
        location: [
            '.pv-top-card--list-bullet .text-body-small',
            '.pv-text-details__left-panel .text-body-small',
            'span.text-body-small[class*="inline"]',
        ],
        connections: [
            '.pv-top-card--list-bullet li:last-child span',
            'a[href*="connections"] span',
            'span[class*="t-bold"][class*="pv-top-card"]',
        ],
        // Updated selectors based on actual LinkedIn DOM structure
        experienceSection: '#experience ~ .pvs-list__outer-container > ul > li',
        educationSection: '#education ~ .pvs-list__outer-container > ul > li',
        skillsSection: '#skills ~ .pvs-list__outer-container > ul > li',
        // Alternative selectors for different profile layouts
        experienceAlt: '#experience ~ div ul.pvs-list > li.pvs-list__item--line-separated',
        educationAlt: '#education ~ div ul.pvs-list > li.pvs-list__item--line-separated',
        skillsAlt: '#skills ~ div ul.pvs-list > li.pvs-list__item--line-separated',
    },
    // Messaging page selectors
    messaging: {
        input: '.msg-form__contenteditable',
        conversationList: '.msg-conversations-container__conversations-list',
        messageItem: '.msg-s-event-listitem',
        senderName: '.msg-s-message-group__profile-link',
        messageText: '.msg-s-event-listitem__body',
    },
    // Job page selectors
    job: {
        container: '.jobs-details',
        title: '.jobs-unified-top-card__job-title',
        company: '.jobs-unified-top-card__company-name',
        description: '.jobs-description__content',
        requirements: '.jobs-description-content__text',
    },
    // Own profile indicators (elements only visible on own profile)
    ownProfileIndicators: [
        '[data-control-name="edit_profile_from_top_card"]',
        'button[aria-label*="Edit intro"]',
        '.pv-top-card--photo-resize-trigger',
        'button[aria-label*="Add profile section"]',
        '.pv-top-card__edit-button',
        '[data-view-name="profile-top-card-quick-actions"]',
        'button[aria-label*="Open profile detail edit modal"]',
    ],
};

// ==================== TYPES ====================

export interface ProfileData {
    linkedInId: string; // Unique identifier from profile URL
    name: string;
    headline: string;
    about: string;
    profileUrl: string;
    location?: string;
    connections?: string;
    experience: Array<{ title?: string; company?: string; duration?: string }>;
    education: Array<{ school?: string; degree?: string }>;
    skills: string[];
    extractedAt: number;
}

export interface MessageContext {
    senderName: string;
    messages: Array<{ sender: string; text: string; isOwn: boolean }>;
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

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate random delay between min and max for human-like behavior
 */
export function getRandomDelay(min = RATE_LIMIT.EXTRACTION_DELAY_MIN, max = RATE_LIMIT.EXTRACTION_DELAY_MAX): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Try multiple selectors and return first match
 */
export function queryWithFallback(selectors: string[]): Element | null {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }
    return null;
}

/**
 * Get text content from element using fallback selectors
 */
export function getTextWithFallback(selectors: string[]): string {
    const element = queryWithFallback(selectors);
    return element?.textContent?.trim() || '';
}

// ==================== SESSION DETECTION ====================

/**
 * Check if user is logged into LinkedIn
 * Detects by checking for logged-in UI elements
 */
export function checkLinkedInLoginStatus(): LinkedInSessionStatus {
    // Check for elements that only appear when logged in
    const loggedInIndicators = [
        '.global-nav__me-photo', // Profile photo in nav
        '.feed-identity-module', // Feed identity module
        '.global-nav__primary-link--active', // Active nav links
        'img.global-nav__me-photo', // Profile photo
        '.authentication-outlet', // Auth outlet for logged in users
    ];

    let isLoggedIn = false;
    for (const selector of loggedInIndicators) {
        if (document.querySelector(selector)) {
            isLoggedIn = true;
            break;
        }
    }

    // Also check for login page indicators (means NOT logged in)
    const loginPageIndicators = [
        '.login__form',
        'form.login__form',
        '.authwall-join-form',
    ];

    for (const selector of loginPageIndicators) {
        if (document.querySelector(selector)) {
            isLoggedIn = false;
            break;
        }
    }

    // Try to get user info if logged in
    let profileUrl: string | undefined;
    let userName: string | undefined;

    if (isLoggedIn) {
        const profileLink = document.querySelector('.global-nav__me-photo')?.closest('a');
        profileUrl = profileLink?.getAttribute('href') || undefined;

        const nameElement = document.querySelector('.feed-identity-module__actor-meta');
        userName = nameElement?.textContent?.trim() || undefined;
    }

    return {
        isLoggedIn,
        profileUrl,
        userName,
    };
}

/**
 * Check if currently viewing own profile
 */
export function isOwnProfile(): boolean {
    for (const selector of SELECTORS.ownProfileIndicators) {
        if (document.querySelector(selector)) {
            return true;
        }
    }
    return false;
}

// ==================== RATE LIMITING ====================

const STORAGE_KEYS = {
    LAST_PROFILE_SYNC: 'linkedboost_last_profile_sync',
    REPLY_COUNT_HOUR: 'linkedboost_reply_count_hour',
    REPLY_HOUR_START: 'linkedboost_reply_hour_start',
};

/**
 * Check if profile sync is allowed based on rate limits
 */
export async function canSyncProfile(): Promise<RateLimitStatus> {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEYS.LAST_PROFILE_SYNC], (result) => {
            const lastSync = result[STORAGE_KEYS.LAST_PROFILE_SYNC] || 0;
            const now = Date.now();
            const timeSinceLastSync = now - lastSync;

            if (timeSinceLastSync < RATE_LIMIT.PROFILE_SYNC_INTERVAL) {
                const waitTime = Math.ceil((RATE_LIMIT.PROFILE_SYNC_INTERVAL - timeSinceLastSync) / 1000);
                resolve({
                    canProceed: false,
                    waitTime,
                    message: `Vui lòng đợi ${waitTime} giây trước khi đồng bộ lại`,
                });
            } else {
                resolve({ canProceed: true });
            }
        });
    });
}

/**
 * Record profile sync timestamp
 */
export async function recordProfileSync(): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set({
            [STORAGE_KEYS.LAST_PROFILE_SYNC]: Date.now(),
        }, resolve);
    });
}

/**
 * Check if reply suggestion is allowed based on rate limits
 */
export async function canSuggestReply(): Promise<RateLimitStatus> {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEYS.REPLY_COUNT_HOUR, STORAGE_KEYS.REPLY_HOUR_START], (result) => {
            const now = Date.now();
            const hourStart = result[STORAGE_KEYS.REPLY_HOUR_START] || 0;
            const replyCount = result[STORAGE_KEYS.REPLY_COUNT_HOUR] || 0;
            const oneHour = 60 * 60 * 1000;

            // Reset count if hour has passed
            if (now - hourStart > oneHour) {
                chrome.storage.local.set({
                    [STORAGE_KEYS.REPLY_COUNT_HOUR]: 0,
                    [STORAGE_KEYS.REPLY_HOUR_START]: now,
                });
                resolve({ canProceed: true });
                return;
            }

            if (replyCount >= RATE_LIMIT.MAX_REPLIES_PER_HOUR) {
                const waitTime = Math.ceil((oneHour - (now - hourStart)) / 60000);
                resolve({
                    canProceed: false,
                    waitTime: waitTime * 60,
                    message: `Đã đạt giới hạn ${RATE_LIMIT.MAX_REPLIES_PER_HOUR} replies/giờ. Vui lòng đợi ${waitTime} phút`,
                });
            } else {
                resolve({ canProceed: true });
            }
        });
    });
}

/**
 * Record reply suggestion usage
 */
export async function recordReplySuggestion(): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEYS.REPLY_COUNT_HOUR, STORAGE_KEYS.REPLY_HOUR_START], (result) => {
            const now = Date.now();
            const hourStart = result[STORAGE_KEYS.REPLY_HOUR_START] || now;
            const replyCount = result[STORAGE_KEYS.REPLY_COUNT_HOUR] || 0;

            chrome.storage.local.set({
                [STORAGE_KEYS.REPLY_COUNT_HOUR]: replyCount + 1,
                [STORAGE_KEYS.REPLY_HOUR_START]: hourStart,
            }, resolve);
        });
    });
}

// ==================== DATA EXTRACTION ====================

/**
 * Extract LinkedIn ID from profile URL
 * URL format: linkedin.com/in/username or linkedin.com/in/username/
 */
export function extractLinkedInId(url: string): string {
    const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
    return match ? match[1] : '';
}

/**
 * Get the currently logged-in user's profile URL
 */
export function getOwnProfileUrl(): string | null {
    // Try to get from the profile dropdown or nav
    const profileLink = document.querySelector('a[href*="/in/"][href*="miniProfileUrn"]') as HTMLAnchorElement;
    if (profileLink) {
        return profileLink.href;
    }

    // Try the "View Profile" button
    const viewProfileBtn = document.querySelector('a[href^="/in/"]') as HTMLAnchorElement;
    if (viewProfileBtn && viewProfileBtn.href.includes('/in/')) {
        return viewProfileBtn.href;
    }

    // If on own profile page
    if (window.location.href.includes('/in/')) {
        return window.location.href;
    }

    return null;
}

/**
 * Navigate to own profile page
 */
export function navigateToOwnProfile(): void {
    window.location.href = 'https://www.linkedin.com/in/me/';
}

/**
 * Extract profile data from current LinkedIn profile page
 */
export async function extractProfileData(): Promise<ProfileData> {
    // Add random delay for human-like behavior
    await sleep(getRandomDelay());

    console.log('LinkedBoost AI: Starting profile extraction...');

    // Extract LinkedIn ID from current URL
    const profileUrl = window.location.href;
    const linkedInId = extractLinkedInId(profileUrl);

    if (!linkedInId) {
        throw new Error('Could not extract LinkedIn ID from URL');
    }

    console.log('LinkedBoost AI: Extracted LinkedIn ID:', linkedInId);

    const data: ProfileData = {
        linkedInId,
        name: getTextWithFallback(SELECTORS.profile.name),
        headline: getTextWithFallback(SELECTORS.profile.headline),
        about: getTextWithFallback(SELECTORS.profile.about),
        profileUrl,
        location: getTextWithFallback(SELECTORS.profile.location),
        connections: getTextWithFallback(SELECTORS.profile.connections),
        experience: [],
        education: [],
        skills: [],
        extractedAt: Date.now(),
    };

    console.log('LinkedBoost AI: Basic info extracted', {
        linkedInId: data.linkedInId,
        name: data.name,
        headline: data.headline,
    });

    // ============ EXPERIENCE EXTRACTION ============
    // Try multiple aggressive selectors for experience
    const experienceSelectors = [
        '#experience ~ .pvs-list__outer-container > ul > li',
        '#experience ~ div .pvs-list__outer-container > ul > li',
        '#experience ~ * .pvs-list > li',
        'section:has(#experience) .pvs-list > li',
        '[id*="experience" i] ~ div li.artdeco-list__item',
        '#experience-section li',
        '.pv-experience-section .pv-entity__position-group-pager li',
    ];

    let experienceItems: NodeListOf<Element> | null = null;
    for (const selector of experienceSelectors) {
        try {
            const items = document.querySelectorAll(selector);
            if (items.length > 0) {
                console.log(`LinkedBoost AI: Found ${items.length} experience items with: ${selector}`);
                experienceItems = items;
                break;
            }
        } catch (e) {
            // Some selectors may be invalid in older browsers
        }
    }

    if (!experienceItems || experienceItems.length === 0) {
        // Last resort: find any li inside the experience section
        const expSection = document.getElementById('experience');
        if (expSection) {
            const parent = expSection.closest('section') || expSection.parentElement?.parentElement;
            if (parent) {
                experienceItems = parent.querySelectorAll('li');
                console.log(`LinkedBoost AI: Fallback - found ${experienceItems?.length || 0} items in experience parent`);
            }
        }
    }

    if (experienceItems && experienceItems.length > 0) {
        data.experience = Array.from(experienceItems).slice(0, 10).map((item, idx) => {
            // Get all visible text spans with aria-hidden
            const allSpans = item.querySelectorAll('span[aria-hidden="true"]');
            const texts = Array.from(allSpans).map(s => s.textContent?.trim()).filter(t => t && t.length > 2);

            console.log(`LinkedBoost AI: Exp item ${idx}:`, texts.slice(0, 3));

            // First visible text is usually the title
            const title = texts[0] || undefined;
            // Second is usually company
            const company = texts[1] || undefined;
            // Third often contains duration
            const duration = texts.find(t => t?.includes('·') || t?.match(/\d{4}/) || t?.includes('yr') || t?.includes('mo'));

            return { title, company, duration };
        }).filter(exp => exp.title && exp.title.length > 2);
    }

    console.log(`LinkedBoost AI: Extracted ${data.experience.length} experience items`);

    // ============ EDUCATION EXTRACTION ============
    const educationSelectors = [
        '#education ~ .pvs-list__outer-container > ul > li',
        '#education ~ div .pvs-list__outer-container > ul > li',
        '#education ~ * .pvs-list > li',
        'section:has(#education) .pvs-list > li',
    ];

    let educationItems: NodeListOf<Element> | null = null;
    for (const selector of educationSelectors) {
        try {
            const items = document.querySelectorAll(selector);
            if (items.length > 0) {
                console.log(`LinkedBoost AI: Found ${items.length} education items with: ${selector}`);
                educationItems = items;
                break;
            }
        } catch (e) { }
    }

    if (!educationItems || educationItems.length === 0) {
        const eduSection = document.getElementById('education');
        if (eduSection) {
            const parent = eduSection.closest('section') || eduSection.parentElement?.parentElement;
            if (parent) {
                educationItems = parent.querySelectorAll('li');
            }
        }
    }

    if (educationItems && educationItems.length > 0) {
        data.education = Array.from(educationItems).slice(0, 5).map((item) => {
            const allSpans = item.querySelectorAll('span[aria-hidden="true"]');
            const texts = Array.from(allSpans).map(s => s.textContent?.trim()).filter(t => t && t.length > 2);

            return {
                school: texts[0] || undefined,
                degree: texts[1] || undefined
            };
        }).filter(edu => edu.school);
    }

    console.log(`LinkedBoost AI: Extracted ${data.education.length} education items`);

    // ============ SKILLS EXTRACTION ============
    const skillsSelectors = [
        '#skills ~ .pvs-list__outer-container > ul > li',
        '#skills ~ div .pvs-list__outer-container > ul > li',
        '#skills ~ * .pvs-list > li',
        'section:has(#skills) .pvs-list > li',
    ];

    let skillItems: NodeListOf<Element> | null = null;
    for (const selector of skillsSelectors) {
        try {
            const items = document.querySelectorAll(selector);
            if (items.length > 0) {
                console.log(`LinkedBoost AI: Found ${items.length} skill items with: ${selector}`);
                skillItems = items;
                break;
            }
        } catch (e) { }
    }

    if (!skillItems || skillItems.length === 0) {
        const skillSection = document.getElementById('skills');
        if (skillSection) {
            const parent = skillSection.closest('section') || skillSection.parentElement?.parentElement;
            if (parent) {
                skillItems = parent.querySelectorAll('li');
            }
        }
    }

    if (skillItems && skillItems.length > 0) {
        data.skills = Array.from(skillItems).slice(0, 20).map((item) => {
            const span = item.querySelector('span[aria-hidden="true"]');
            return span?.textContent?.trim();
        }).filter((skill): skill is string => !!skill && skill.length > 1 && !skill.includes('endorsement'));
    }

    console.log(`LinkedBoost AI: Extracted ${data.skills.length} skills`);
    console.log('LinkedBoost AI: Extraction complete', {
        experienceCount: data.experience.length,
        educationCount: data.education.length,
        skillsCount: data.skills.length,
    });

    return data;
}


/**
 * Extract message context from current conversation
 */
export async function extractMessageContext(): Promise<MessageContext | null> {
    await sleep(getRandomDelay(500, 1500));

    const conversationContainer = document.querySelector('.msg-s-message-list-container');
    if (!conversationContainer) return null;

    const messages: MessageContext['messages'] = [];
    const messageItems = conversationContainer.querySelectorAll('.msg-s-event-listitem');

    messageItems.forEach((item) => {
        const senderEl = item.querySelector('.msg-s-message-group__profile-link');
        const textEl = item.querySelector('.msg-s-event-listitem__body');
        const isOwn = item.classList.contains('msg-s-event-listitem--outbound');

        if (textEl) {
            messages.push({
                sender: senderEl?.textContent?.trim() || (isOwn ? 'You' : 'Other'),
                text: textEl.textContent?.trim() || '',
                isOwn,
            });
        }
    });

    // Get sender name from conversation header
    const senderName = document.querySelector('.msg-overlay-bubble-header__title')?.textContent?.trim() ||
        document.querySelector('.msg-thread__link-to-profile')?.textContent?.trim() || '';

    return {
        senderName,
        messages: messages.slice(-10), // Last 10 messages for context
        conversationUrl: window.location.href,
    };
}

/**
 * Extract job details from current job posting page
 */
export async function extractJobDetails(): Promise<JobDetails | null> {
    await sleep(getRandomDelay());

    const container = queryWithFallback([SELECTORS.job.container]);
    if (!container) return null;

    return {
        title: getTextWithFallback([SELECTORS.job.title]),
        company: getTextWithFallback([SELECTORS.job.company]),
        description: getTextWithFallback([SELECTORS.job.description]),
        jobUrl: window.location.href,
        extractedAt: Date.now(),
    };
}

// ==================== EXPORTS ====================

export const LinkedInAPI = {
    // Session
    checkLinkedInLoginStatus,
    isOwnProfile,

    // Rate limiting
    canSyncProfile,
    recordProfileSync,
    canSuggestReply,
    recordReplySuggestion,

    // Data extraction
    extractProfileData,
    extractMessageContext,
    extractJobDetails,

    // Utilities
    getRandomDelay,
    sleep,
    queryWithFallback,
    getTextWithFallback,

    // Constants
    RATE_LIMIT,
    SELECTORS,
};

export default LinkedInAPI;
