// LinkedIn Content Script for LinkedBoost AI

import { createRoot } from 'react-dom/client';
import { ReplyHelper } from './components/ReplyHelper';
import { ProfileBadge } from './components/ProfileBadge';
import { FloatingControls } from './components/FloatingControls';
import './styles/floatingControls.css';
import {
    checkLinkedInLoginStatus,
    isOwnProfile as checkIsOwnProfile,
    canSyncProfile,
    recordProfileSync,
    extractProfileData as extractProfileDataFromAPI,
} from '../lib/linkedinApi';
import { API_BASE } from '../lib/constants';

// Constants
const LINKEDIN_MESSAGING_SELECTOR = '.msg-form__contenteditable';
const LINKEDIN_PROFILE_SELECTOR = '.pv-top-card';
const LINKEDIN_JOB_SELECTOR = '.jobs-details';
const FLOATING_CONTROLS_ID = 'linkedboost-floating-controls';

// State
let replyHelperEnabled = false;
let observerActive = false;
let profileSyncAttempted = false;
let linkedInSessionChecked = false;
let floatingControlsMounted = false;

// Initialize content script
function init() {
    console.log('LinkedBoost AI: Content script initialized');

    // Check LinkedIn login status on init
    checkLinkedInSession();

    // Mount floating controls
    mountFloatingControls();

    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        switch (message.action) {
            case 'enableReplyHelper':
                enableReplyHelper();
                sendResponse({ success: true });
                break;
            case 'analyzeProfile':
                analyzeCurrentProfile();
                sendResponse({ success: true });
                break;
            case 'analyzeJob':
                analyzeCurrentJob();
                sendResponse({ success: true });
                break;
            case 'authComplete':
                // User just logged in, try to sync profile if on profile page
                profileSyncAttempted = false;
                checkAndSyncProfile();
                // Re-mount floating controls with auth state
                mountFloatingControls();
                sendResponse({ success: true });
                break;
            case 'extractAndSyncProfile':
                // Manual sync request from popup
                profileSyncAttempted = false;
                forceExtractAndSyncProfile();
                sendResponse({ success: true });
                break;
            case 'getLinkedInStatus':
                // Return LinkedIn login status
                const status = checkLinkedInLoginStatus();
                sendResponse(status);
                break;
            case 'checkRateLimit':
                // Check if rate limit allows action
                handleRateLimitCheck(message.data?.type).then(sendResponse);
                return true; // async response
        }
        return true;
    });

    // Auto-detect page type and initialize features
    detectPageType();

    // Watch for page navigation (LinkedIn is SPA)
    const pageObserver = new MutationObserver(() => {
        detectPageType();
        // Re-check LinkedIn session on navigation
        if (!linkedInSessionChecked) {
            checkLinkedInSession();
        }
        // Re-mount floating controls on navigation
        if (!document.getElementById(FLOATING_CONTROLS_ID)) {
            floatingControlsMounted = false;
            mountFloatingControls();
        }
    });

    pageObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Check if user is authenticated and on profile page - auto sync
    checkAndSyncProfile();

    // Auto-scan own profile if user is logged in and hasn't synced recently
    autoScanOwnProfile();
}

// Auto-scan own profile: navigate to own profile and extract data
async function autoScanOwnProfile() {
    try {
        // Check if user is authenticated with our app
        const result = await chrome.storage.local.get(['isAuthenticated', 'user', 'lastAutoScan']);
        const isAuthenticated = !!(result.isAuthenticated && result.user);

        if (!isAuthenticated) {
            console.log('LinkedBoost AI: User not authenticated, skipping auto-scan');
            return;
        }

        // Check if we recently did an auto-scan (within 1 hour)
        const lastAutoScan = result.lastAutoScan || 0;
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - lastAutoScan < oneHour) {
            console.log('LinkedBoost AI: Recently scanned, skipping auto-scan');
            return;
        }

        // Check LinkedIn login status
        const linkedInStatus = checkLinkedInLoginStatus();
        if (!linkedInStatus.isLoggedIn) {
            console.log('LinkedBoost AI: User not logged into LinkedIn');
            return;
        }

        // If we're already on user's own profile page, extract data
        const currentUrl = window.location.href;
        const isOnOwnProfile = checkIsOwnProfile() || currentUrl.includes('/in/me/');

        if (isOnOwnProfile) {
            console.log('LinkedBoost AI: On own profile, starting full extraction...');
            await performFullProfileScan();
        } else if (currentUrl.includes('linkedin.com') && !currentUrl.includes('/in/')) {
            // User is on LinkedIn but not on a profile page
            // Show a toast suggesting to visit their profile
            console.log('LinkedBoost AI: Suggest visiting own profile for full sync');
            showSyncSuggestion();
        }
    } catch (err) {
        console.error('LinkedBoost AI: Auto-scan error', err);
    }
}

// Perform full profile scan with scrolling to load all sections
async function performFullProfileScan() {
    console.log('LinkedBoost AI: Starting full profile scan...');

    try {
        // Scroll down to load all sections (experience, education, skills)
        await scrollToLoadSections();

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extract profile data
        const profileData = await extractProfileDataFromAPI();

        console.log('LinkedBoost AI: Full extraction complete', {
            name: profileData.name,
            headline: profileData.headline,
            experienceCount: profileData.experience?.length || 0,
            educationCount: profileData.education?.length || 0,
            skillsCount: profileData.skills?.length || 0,
        });

        // Sync to server via background worker
        const syncResult = await chrome.runtime.sendMessage({
            action: 'syncProfile',
            data: { profileData },
        });

        if (!syncResult.success) {
            throw new Error(syncResult.error || 'Sync failed');
        }

        // Record auto-scan timestamp
        await chrome.storage.local.set({ lastAutoScan: Date.now() });

        // Show success notification
        showToast('✅ Đã đồng bộ đầy đủ thông tin profile!', 'success');

    } catch (err) {
        console.error('LinkedBoost AI: Full scan failed', err);
        showToast('❌ Không thể đồng bộ profile', 'error');
    }
}

// Scroll page to load all sections - improved version with comprehensive scrolling
async function scrollToLoadSections() {
    console.log('LinkedBoost AI: Starting comprehensive scroll to load all sections...');

    // First, scroll to the bottom of the page in steps to trigger lazy loading
    const documentHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollSteps = Math.ceil(documentHeight / viewportHeight);

    // Scroll down in viewport-sized steps
    for (let i = 1; i <= scrollSteps; i++) {
        const scrollPosition = Math.min(i * viewportHeight, documentHeight - viewportHeight);
        window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 600));
    }

    // Now scroll to specific sections to ensure they're loaded
    const sections = [
        { id: '#about', name: 'About' },
        { id: '#experience', name: 'Experience' },
        { id: '#education', name: 'Education' },
        { id: '#skills', name: 'Skills' },
        { id: '#recommendations', name: 'Recommendations' },
    ];

    for (const section of sections) {
        const sectionEl = document.querySelector(section.id);
        if (sectionEl) {
            console.log(`LinkedBoost AI: Scrolling to ${section.name} section`);
            sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Wait for lazy-loaded content
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Click "Show all" buttons if present to expand lists
            const showAllButtons = sectionEl.parentElement?.querySelectorAll('button[aria-label*="Show all"]');
            if (showAllButtons && showAllButtons.length > 0) {
                console.log(`LinkedBoost AI: Found ${showAllButtons.length} "Show all" button(s), but not clicking (respecting rate limits)`);
            }
        }
    }

    // Wait a bit more for any async content
    await new Promise(resolve => setTimeout(resolve, 500));

    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('LinkedBoost AI: Scroll complete, ready for extraction');
}

// Show sync suggestion toast
function showSyncSuggestion() {
    const existingToast = document.getElementById('linkedboost-sync-suggestion');
    if (existingToast) return;

    const toast = document.createElement('div');
    toast.id = 'linkedboost-sync-suggestion';
    toast.innerHTML = `
        <div style="position: fixed; bottom: 100px; right: 24px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 16px 20px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); z-index: 999998; font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 300px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 24px;">👤</span>
                <div>
                    <p style="margin: 0; font-weight: 600; font-size: 14px;">Đồng bộ Profile LinkedIn</p>
                    <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.8;">Mở profile của bạn để đồng bộ đầy đủ thông tin</p>
                </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 12px;">
                <a href="https://www.linkedin.com/in/me/" style="flex: 1; padding: 8px; background: linear-gradient(135deg, #0077b5 0%, #00a0dc 100%); color: white; text-decoration: none; border-radius: 6px; text-align: center; font-size: 12px; font-weight: 500;">Mở Profile</a>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="padding: 8px 12px; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 6px; cursor: pointer; font-size: 12px;">Đóng</button>
            </div>
        </div>
    `;
    document.body.appendChild(toast);

    // Auto remove after 10 seconds
    setTimeout(() => toast.remove(), 10000);
}

// Mount floating controls UI
async function mountFloatingControls() {
    if (floatingControlsMounted || document.getElementById(FLOATING_CONTROLS_ID)) {
        return;
    }

    // Check auth status
    let isAuthenticated = false;
    let isProfileSynced = false;

    try {
        const result = await chrome.storage.local.get(['isAuthenticated', 'user', 'profileSynced']);
        isAuthenticated = !!(result.isAuthenticated && result.user);
        isProfileSynced = result.profileSynced || false;
    } catch (e) {
        console.error('LinkedBoost AI: Failed to check auth status', e);
    }

    // Create container
    const container = document.createElement('div');
    container.id = FLOATING_CONTROLS_ID;
    document.body.appendChild(container);

    // Mount React component
    const root = createRoot(container);
    root.render(
        <FloatingControls
            isAuthenticated={isAuthenticated}
            isProfileSynced={isProfileSynced}
            onSyncProfile={() => {
                profileSyncAttempted = false;
                forceExtractAndSyncProfile();
            }}
            onEnableReply={enableReplyHelper}
            onAnalyzeProfile={analyzeCurrentProfile}
            onAnalyzeJob={analyzeCurrentJob}
            onOpenDashboard={() => {
                chrome.tabs?.create?.({ url: `${API_BASE}/dashboard` });
            }}
        />
    );

    floatingControlsMounted = true;
    console.log('LinkedBoost AI: Floating controls mounted');
}

// Check LinkedIn session and store status
function checkLinkedInSession() {
    const status = checkLinkedInLoginStatus();
    linkedInSessionChecked = true;

    // Store LinkedIn session status for popup to access
    chrome.storage.local.set({
        linkedInSession: {
            isLoggedIn: status.isLoggedIn,
            userName: status.userName,
            profileUrl: status.profileUrl,
            checkedAt: Date.now(),
        },
    });

    if (!status.isLoggedIn) {
        console.log('LinkedBoost AI: User not logged into LinkedIn');
    } else {
        console.log('LinkedBoost AI: LinkedIn session detected', status.userName);
    }

    return status;
}

// Handle rate limit check requests
async function handleRateLimitCheck(type: string) {
    switch (type) {
        case 'profileSync':
            return canSyncProfile();
        default:
            return { canProceed: true };
    }
}

// Shared profile sync logic
async function performProfileSync(options: { force: boolean }): Promise<void> {
    const url = window.location.href;

    if (!url.includes('/in/')) {
        if (options.force) {
            showToast('Vui lòng mở trang profile LinkedIn', 'error');
        }
        return;
    }

    // Check LinkedIn login status first
    const linkedInStatus = checkLinkedInLoginStatus();
    if (!linkedInStatus.isLoggedIn) {
        if (options.force) {
            showToast('Vui lòng đăng nhập LinkedIn trước', 'error');
        } else {
            console.log('LinkedBoost AI: Not logged into LinkedIn, skipping sync');
        }
        return;
    }

    // Check if user is authenticated with LinkedBoost
    const authState = await chrome.runtime.sendMessage({ action: 'getAuthState' });
    if (!authState.isLoggedIn) {
        if (options.force) {
            showToast('Vui lòng đăng nhập LinkedBoost AI', 'error');
        }
        return;
    }

    // Check rate limit
    const rateLimitStatus = await canSyncProfile();
    if (!rateLimitStatus.canProceed) {
        if (options.force) {
            showToast(rateLimitStatus.message || 'Vui lòng đợi trước khi đồng bộ lại', 'error');
        } else {
            console.log('LinkedBoost AI: Rate limited -', rateLimitStatus.message);
        }
        return;
    }

    // Wait for profile card to load
    await waitForElement(LINKEDIN_PROFILE_SELECTOR, 5000);

    if (options.force) {
        showToast('Đang đồng bộ profile...', 'success');
    }

    // Extract profile data
    const profileData = await extractProfileDataFromAPI();
    console.log('LinkedBoost AI: Syncing profile data...', profileData);

    const result = await chrome.runtime.sendMessage({
        action: 'syncProfile',
        data: { profileData },
    });

    if (result.success) {
        // Record sync for rate limiting
        await recordProfileSync();

        // Store profile data locally for popup to display
        chrome.storage.local.set({
            profileSynced: true,
            lastSyncTime: Date.now(),
            profileData: {
                name: profileData.name,
                headline: profileData.headline,
                profileUrl: profileData.profileUrl,
                location: profileData.location,
                connections: profileData.connections,
            },
        });
        showToast(options.force ? '✓ Profile đã đồng bộ thành công!' : '✓ Profile đã đồng bộ với LinkedBoost AI!', 'success');
        console.log('LinkedBoost AI: Profile synced successfully');
    } else {
        if (options.force) {
            showToast('Không thể đồng bộ profile', 'error');
        }
        console.error('LinkedBoost AI: Profile sync failed', result.error);
    }
}

// Check if authenticated and sync profile data
async function checkAndSyncProfile() {
    if (profileSyncAttempted) return;

    // Only sync own profile
    const url = window.location.href;
    if (!url.includes('/in/')) return;

    try {
        // Wait for profile card to load before checking own profile
        await waitForElement(LINKEDIN_PROFILE_SELECTOR, 5000);

        if (!checkIsOwnProfile()) {
            console.log('LinkedBoost AI: Not viewing own profile, skipping sync');
            return;
        }

        profileSyncAttempted = true;
        await performProfileSync({ force: false });
    } catch (error) {
        console.error('LinkedBoost AI: Error checking/syncing profile', error);
    }
}

// Force extract and sync profile (manual trigger from popup)
async function forceExtractAndSyncProfile() {
    try {
        await performProfileSync({ force: true });
    } catch (error) {
        console.error('LinkedBoost AI: Force sync error', error);
        showToast('Có lỗi xảy ra', 'error');
    }
}

// Wait for an element to appear
function waitForElement(selector: string, timeout: number): Promise<Element | null> {
    return new Promise((resolve) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);
    });
}

// Detect current LinkedIn page type
function detectPageType() {
    const url = window.location.href;

    if (url.includes('/messaging/')) {
        // Messaging page - can enable reply helper
        if (replyHelperEnabled) {
            injectReplyHelper();
        }
    } else if (url.includes('/in/')) {
        // Profile page - check and sync profile
        checkAndSyncProfile();
    } else if (url.includes('/jobs/')) {
        // Job page - job match option available
    }
}

// Enable reply helper on messaging pages
function enableReplyHelper() {
    replyHelperEnabled = true;
    injectReplyHelper();
}

// Inject reply helper into messaging UI
function injectReplyHelper() {
    // Find message input areas
    const messageInputs = document.querySelectorAll(LINKEDIN_MESSAGING_SELECTOR);

    messageInputs.forEach((input) => {
        const parent = input.closest('.msg-form');
        if (!parent || parent.querySelector('.linkedboost-reply-btn')) {
            return; // Already has button
        }

        // Create button container
        const container = document.createElement('div');
        container.className = 'linkedboost-container';
        container.style.cssText = 'display: inline-flex; margin-left: 8px;';

        // Mount React component
        const root = createRoot(container);
        root.render(<ReplyHelper messageInput={input as HTMLElement} />);

        // Insert after input
        const toolbar = parent.querySelector('.msg-form__footer');
        if (toolbar) {
            toolbar.insertBefore(container, toolbar.firstChild);
        }
    });

    // Set up observer for new message inputs
    if (!observerActive) {
        observerActive = true;
        const observer = new MutationObserver(() => {
            injectReplyHelper();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
}

// Analyze current profile page
function analyzeCurrentProfile() {
    const profileSection = document.querySelector(LINKEDIN_PROFILE_SELECTOR);
    if (!profileSection) {
        showToast('Please navigate to a LinkedIn profile page', 'error');
        return;
    }

    // Extract profile data from DOM
    const profileData = extractProfileData();

    // Create badge container
    const existingBadge = document.querySelector('.linkedboost-profile-badge');
    if (existingBadge) {
        existingBadge.remove();
    }

    const container = document.createElement('div');
    container.className = 'linkedboost-container';
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(<ProfileBadge profileData={profileData} />);
}

// Extract profile data from LinkedIn DOM
function extractProfileData() {
    const data: Record<string, unknown> = {};

    // Name
    const nameEl = document.querySelector('.pv-top-card--list .text-heading-xlarge');
    data.name = nameEl?.textContent?.trim() || '';

    // Headline
    const headlineEl = document.querySelector('.pv-top-card--list .text-body-medium');
    data.headline = headlineEl?.textContent?.trim() || '';

    // About
    const aboutEl = document.querySelector('#about ~ .display-flex .pv-shared-text-with-see-more span[aria-hidden="true"]');
    data.about = aboutEl?.textContent?.trim() || '';

    // Profile URL
    data.profileUrl = window.location.href;

    // Experience
    const experienceItems = document.querySelectorAll('#experience ~ .pvs-list__outer-container .pvs-entity');
    data.experience = Array.from(experienceItems).slice(0, 5).map((item) => {
        const title = item.querySelector('.t-bold span[aria-hidden="true"]')?.textContent?.trim();
        const company = item.querySelector('.t-normal span[aria-hidden="true"]')?.textContent?.trim();
        return { title, company };
    });

    // Skills
    const skillItems = document.querySelectorAll('#skills ~ .pvs-list__outer-container .pvs-entity');
    data.skills = Array.from(skillItems).slice(0, 10).map((item) => {
        return item.querySelector('.t-bold span[aria-hidden="true"]')?.textContent?.trim();
    }).filter(Boolean);

    // Education
    const educationItems = document.querySelectorAll('#education ~ .pvs-list__outer-container .pvs-entity');
    data.education = Array.from(educationItems).slice(0, 3).map((item) => {
        const school = item.querySelector('.t-bold span[aria-hidden="true"]')?.textContent?.trim();
        const degree = item.querySelector('.t-normal span[aria-hidden="true"]')?.textContent?.trim();
        return { school, degree };
    });

    return data;
}

// Analyze current job posting
function analyzeCurrentJob() {
    const jobSection = document.querySelector(LINKEDIN_JOB_SELECTOR);
    if (!jobSection) {
        showToast('Please navigate to a LinkedIn job posting', 'error');
        return;
    }

    // Extract job data
    const jobData = extractJobData();

    // Send to background for analysis
    chrome.runtime.sendMessage({
        action: 'analyzeJobMatch',
        data: { jobData },
    }, (response) => {
        if (response.error) {
            showToast('Failed to analyze job match', 'error');
        } else {
            showJobMatchResult(response.data);
        }
    });
}

// Extract job data from LinkedIn DOM
function extractJobData() {
    const data: Record<string, unknown> = {};

    // Job title
    const titleEl = document.querySelector('.jobs-unified-top-card__job-title');
    data.title = titleEl?.textContent?.trim() || '';

    // Company
    const companyEl = document.querySelector('.jobs-unified-top-card__company-name');
    data.company = companyEl?.textContent?.trim() || '';

    // Description
    const descEl = document.querySelector('.jobs-description__content');
    data.description = descEl?.textContent?.trim() || '';

    // URL
    data.jobUrl = window.location.href;

    return data;
}

// Show job match result
function showJobMatchResult(result: { matchScore: number }) {
    showToast(`Job Match Score: ${result.matchScore}% - Click extension for details`, 'success');
}

// Show toast notification
function showToast(message: string, type: 'success' | 'error' = 'success') {
    const existingToast = document.querySelector('.linkedboost-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `linkedboost-container linkedboost-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Start
init();

export { };
