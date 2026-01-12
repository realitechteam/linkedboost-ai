// LinkedIn Content Script for LinkedBoost AI

import { createRoot } from 'react-dom/client';
import { ReplyHelper } from './components/ReplyHelper';
import { ProfileBadge } from './components/ProfileBadge';

// Constants
const LINKEDIN_MESSAGING_SELECTOR = '.msg-form__contenteditable';
const LINKEDIN_PROFILE_SELECTOR = '.pv-top-card';
const LINKEDIN_JOB_SELECTOR = '.jobs-details';

// State
let replyHelperEnabled = false;
let observerActive = false;
let profileSyncAttempted = false;

// Initialize content script
function init() {
    console.log('LinkedBoost AI: Content script initialized');

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
                sendResponse({ success: true });
                break;
            case 'extractAndSyncProfile':
                // Manual sync request from popup
                profileSyncAttempted = false;
                forceExtractAndSyncProfile();
                sendResponse({ success: true });
                break;
        }
        return true;
    });

    // Auto-detect page type and initialize features
    detectPageType();

    // Watch for page navigation (LinkedIn is SPA)
    const pageObserver = new MutationObserver(() => {
        detectPageType();
    });

    pageObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Check if user is authenticated and on profile page - auto sync
    checkAndSyncProfile();
}

// Check if authenticated and sync profile data
async function checkAndSyncProfile() {
    if (profileSyncAttempted) return;

    const url = window.location.href;

    // Only sync when on any LinkedIn profile page
    if (!url.includes('/in/')) return;

    try {
        // Check if user is authenticated
        const authState = await chrome.runtime.sendMessage({ action: 'getAuthState' });
        if (!authState.isLoggedIn) return;

        // Check if profile already synced recently (within 1 hour)
        const syncStatus = await chrome.runtime.sendMessage({ action: 'checkProfileSynced' });
        const oneHour = 60 * 60 * 1000;
        if (syncStatus.synced && syncStatus.lastSyncTime && (Date.now() - syncStatus.lastSyncTime) < oneHour) {
            console.log('LinkedBoost AI: Profile already synced recently');
            return;
        }

        // Wait for profile card to load
        await waitForElement(LINKEDIN_PROFILE_SELECTOR, 5000);

        // Check if this is the user's own profile
        const isOwnProfile = checkIfOwnProfile();
        if (!isOwnProfile) {
            console.log('LinkedBoost AI: Not viewing own profile, skipping sync');
            return;
        }

        profileSyncAttempted = true;

        // Extract and sync profile data
        const profileData = extractProfileData();
        console.log('LinkedBoost AI: Syncing profile data...', profileData);

        const result = await chrome.runtime.sendMessage({
            action: 'syncProfile',
            data: { profileData },
        });

        if (result.success) {
            // Store profile data locally for popup to display
            chrome.storage.local.set({
                profileData: {
                    name: profileData.name,
                    headline: profileData.headline,
                    profileUrl: profileData.profileUrl,
                },
            });
            showToast('✓ Profile đã đồng bộ với LinkedBoost AI!', 'success');
            console.log('LinkedBoost AI: Profile synced successfully');
        } else {
            console.error('LinkedBoost AI: Profile sync failed', result.error);
        }
    } catch (error) {
        console.error('LinkedBoost AI: Error checking/syncing profile', error);
    }
}

// Force extract and sync profile (manual trigger from popup)
async function forceExtractAndSyncProfile() {
    const url = window.location.href;

    if (!url.includes('/in/')) {
        showToast('Vui lòng mở trang profile LinkedIn', 'error');
        return;
    }

    try {
        // Check if user is authenticated
        const authState = await chrome.runtime.sendMessage({ action: 'getAuthState' });
        if (!authState.isLoggedIn) {
            showToast('Vui lòng đăng nhập LinkedBoost AI', 'error');
            return;
        }

        // Wait for profile card to load
        await waitForElement(LINKEDIN_PROFILE_SELECTOR, 5000);

        // Extract and sync profile data
        const profileData = extractProfileData();
        console.log('LinkedBoost AI: Force syncing profile data...', profileData);

        const result = await chrome.runtime.sendMessage({
            action: 'syncProfile',
            data: { profileData },
        });

        if (result.success) {
            // Store profile data locally for popup to display
            chrome.storage.local.set({
                profileSynced: true,
                lastSyncTime: Date.now(),
                profileData: {
                    name: profileData.name,
                    headline: profileData.headline,
                    profileUrl: profileData.profileUrl,
                },
            });
            showToast('✓ Profile đã đồng bộ thành công!', 'success');
        } else {
            showToast('Không thể đồng bộ profile', 'error');
        }
    } catch (error) {
        console.error('LinkedBoost AI: Force sync error', error);
        showToast('Có lỗi xảy ra', 'error');
    }
}

// Check if viewing own profile
function checkIfOwnProfile(): boolean {
    // Method 1: Check for "Edit" buttons which only appear on own profile
    const editButton = document.querySelector('[data-control-name="edit_profile_from_top_card"]') ||
        document.querySelector('button[aria-label*="Edit intro"]') ||
        document.querySelector('.pv-top-card--photo-resize-trigger');

    // Method 2: Check for "Add profile section" button
    const addSectionButton = document.querySelector('button[aria-label*="Add profile section"]');

    // Method 3: Check for profile edit modal trigger
    const profileEditTrigger = document.querySelector('.pv-top-card__edit-button') ||
        document.querySelector('[data-view-name="profile-top-card-quick-actions"]');

    return !!(editButton || addSectionButton || profileEditTrigger);
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
