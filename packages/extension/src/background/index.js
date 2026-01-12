// Background Service Worker for LinkedBoost AI Extension
// API base URL
const API_BASE = 'http://localhost:3001/api';
// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handleMessage(message).then(sendResponse);
    return true; // Keep the message channel open for async response
});
async function handleMessage(message) {
    switch (message.action) {
        case 'getAuthState':
            return getAuthState();
        case 'suggestReply':
            return suggestReply(message.data);
        case 'analyzeProfile':
            return analyzeProfile(message.data);
        case 'analyzeJobMatch':
            return analyzeJobMatch(message.data);
        case 'syncProfile':
            return syncProfile(message.data);
        case 'checkProfileSynced':
            return checkProfileSynced();
        default:
            return { error: 'Unknown action' };
    }
}
// Get authentication state from storage
async function getAuthState() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['user', 'token'], (result) => {
            resolve({
                isLoggedIn: !!result.token,
                user: result.user || null,
            });
        });
    });
}
// Call AI API for reply suggestions
async function suggestReply(data) {
    const { token } = await chrome.storage.local.get('token');
    if (!token) {
        return { error: 'Not authenticated' };
    }
    try {
        const response = await fetch(`${API_BASE}/ai/reply-suggest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('API request failed');
        }
        return response.json();
    }
    catch (error) {
        console.error('Reply suggestion error:', error);
        return { error: 'Failed to get suggestions' };
    }
}
// Call AI API for profile analysis
async function analyzeProfile(data) {
    const { token } = await chrome.storage.local.get('token');
    if (!token) {
        return { error: 'Not authenticated' };
    }
    try {
        const response = await fetch(`${API_BASE}/ai/profile-analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('API request failed');
        }
        return response.json();
    }
    catch (error) {
        console.error('Profile analysis error:', error);
        return { error: 'Failed to analyze profile' };
    }
}
// Call AI API for job match analysis
async function analyzeJobMatch(data) {
    const { token } = await chrome.storage.local.get('token');
    if (!token) {
        return { error: 'Not authenticated' };
    }
    try {
        const response = await fetch(`${API_BASE}/ai/job-match`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('API request failed');
        }
        return response.json();
    }
    catch (error) {
        console.error('Job match error:', error);
        return { error: 'Failed to analyze job match' };
    }
}
// Sync profile data to web app database
async function syncProfile(data) {
    const { token } = await chrome.storage.local.get('token');
    if (!token) {
        return { error: 'Not authenticated' };
    }
    try {
        const response = await fetch(`${API_BASE}/profile/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('API request failed');
        }
        const result = await response.json();
        // Store sync timestamp locally
        await chrome.storage.local.set({
            profileSynced: true,
            lastSyncTime: Date.now()
        });
        return result;
    }
    catch (error) {
        console.error('Profile sync error:', error);
        return { error: 'Failed to sync profile' };
    }
}
// Check if profile is already synced
async function checkProfileSynced() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['profileSynced', 'lastSyncTime'], (result) => {
            resolve({
                synced: !!result.profileSynced,
                lastSyncTime: result.lastSyncTime,
            });
        });
    });
}
// Handle auth callback from web app
chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
    if (message.type === 'AUTH_SUCCESS') {
        chrome.storage.local.set({
            token: message.token,
            user: message.user,
            profileSynced: false, // Reset sync status on new login
        });
        sendResponse({ success: true });
        // Notify all LinkedIn tabs to check for profile data
        chrome.tabs.query({ url: '*://*.linkedin.com/*' }, (tabs) => {
            tabs.forEach((tab) => {
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, { action: 'authComplete' });
                }
            });
        });
    }
    return true;
});
// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
    console.log('LinkedBoost AI extension installed');
});
export {};
//# sourceMappingURL=index.js.map