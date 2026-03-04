import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, PenTool, User, Briefcase, Settings, ExternalLink, Zap, Crown, CheckCircle, RefreshCw, AlertCircle, LogOut, Link2, Link2Off, } from 'lucide-react';
import { API_BASE } from '../lib/constants';
const features = [
    {
        id: 'reply',
        icon: MessageSquare,
        title: 'Trả Lời Thông Minh',
        description: 'AI gợi ý tin nhắn',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        id: 'post',
        icon: PenTool,
        title: 'Viết Bài',
        description: 'Tạo bài viết chuyên nghiệp',
        color: 'from-purple-500 to-pink-500',
    },
    {
        id: 'profile',
        icon: User,
        title: 'Tối Ưu Profile',
        description: 'Phân tích hồ sơ LinkedIn',
        color: 'from-orange-500 to-yellow-500',
    },
    {
        id: 'job',
        icon: Briefcase,
        title: 'Job Matcher',
        description: 'So khớp công việc',
        color: 'from-green-500 to-emerald-500',
    },
];
export default function App() {
    const [user, setUser] = useState({
        isLoggedIn: false,
    });
    const [linkedInSession, setLinkedInSession] = useState({
        isLoggedIn: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    useEffect(() => {
        checkSession();
        checkLinkedInSessionStatus();
    }, []);
    // Check LinkedIn session status from storage
    const checkLinkedInSessionStatus = async () => {
        try {
            const result = await chrome.storage.local.get(['linkedInSession']);
            if (result.linkedInSession) {
                setLinkedInSession(result.linkedInSession);
            }
        }
        catch (error) {
            console.error('Failed to check LinkedIn session:', error);
        }
    };
    // Fetch session from web app API
    const checkSession = async () => {
        setIsLoading(true);
        try {
            // First try to fetch from web app API
            const response = await fetch(`${API_BASE}/api/auth/session-check`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                if (data.isLoggedIn && data.user) {
                    // Get local profile sync status
                    const localData = await chrome.storage.local.get(['profileSynced', 'lastSyncTime', 'profileData']);
                    setUser({
                        isLoggedIn: true,
                        name: data.user.name,
                        email: data.user.email,
                        image: data.user.image,
                        plan: data.user.plan || 'FREE',
                        profile: {
                            synced: localData.profileSynced || false,
                            name: localData.profileData?.name,
                            headline: localData.profileData?.headline,
                            lastSyncTime: localData.lastSyncTime,
                        },
                        usage: data.usage,
                    });
                    // Save to local storage for offline access
                    chrome.storage.local.set({
                        user: data.user,
                        isAuthenticated: true,
                    });
                }
                else {
                    // Check local storage fallback
                    loadFromLocalStorage();
                }
            }
            else {
                loadFromLocalStorage();
            }
        }
        catch (error) {
            console.error('Session check failed:', error);
            loadFromLocalStorage();
        }
        finally {
            setIsLoading(false);
        }
    };
    const loadFromLocalStorage = () => {
        chrome.storage.local.get(['user', 'isAuthenticated', 'profileSynced', 'lastSyncTime', 'profileData'], (result) => {
            if (result.user && result.isAuthenticated) {
                setUser({
                    isLoggedIn: true,
                    name: result.user.name,
                    email: result.user.email,
                    image: result.user.image,
                    plan: result.user.plan || 'FREE',
                    profile: {
                        synced: result.profileSynced || false,
                        name: result.profileData?.name,
                        headline: result.profileData?.headline,
                        lastSyncTime: result.lastSyncTime,
                    },
                    usage: result.user.usage || {
                        replies: { used: 2, limit: 5 },
                        posts: { used: 1, limit: 3 },
                        profileReviews: { used: 0, limit: 1 },
                        jobMatches: { used: 1, limit: 3 },
                    },
                });
            }
        });
    };
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await checkSession();
        setIsRefreshing(false);
    };
    const handleLogin = () => {
        chrome.tabs.create({ url: `${API_BASE}/login?extension=true` });
    };
    const handleLogout = () => {
        chrome.storage.local.remove(['user', 'isAuthenticated', 'profileSynced', 'lastSyncTime', 'profileData'], () => {
            setUser({ isLoggedIn: false });
        });
    };
    const handleSyncProfile = async () => {
        setIsSyncing(true);
        // Get the active tab first
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            // Check if active tab is a LinkedIn profile page
            if (activeTab?.url?.includes('linkedin.com/in/') && activeTab.id) {
                console.log('Sending sync message to tab:', activeTab.id, activeTab.url);
                chrome.tabs.sendMessage(activeTab.id, { action: 'extractAndSyncProfile' }, (response) => {
                    console.log('Sync response:', response);
                    // Wait and check storage
                    setTimeout(() => {
                        chrome.storage.local.get(['profileSynced', 'lastSyncTime', 'profileData'], (result) => {
                            console.log('Storage after sync:', result);
                            setUser(prev => ({
                                ...prev,
                                profile: {
                                    synced: result.profileSynced || false,
                                    name: result.profileData?.name,
                                    headline: result.profileData?.headline,
                                    lastSyncTime: result.lastSyncTime,
                                },
                            }));
                            setIsSyncing(false);
                        });
                    }, 2000);
                });
            }
            else {
                // Not on profile page, open one
                console.log('Not on LinkedIn profile page, opening...');
                chrome.tabs.create({ url: 'https://www.linkedin.com/in/me/' });
                setIsSyncing(false);
            }
        });
    };
    const handleFeatureClick = (featureId) => {
        if (!user.isLoggedIn) {
            handleLogin();
            return;
        }
        switch (featureId) {
            case 'reply':
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'enableReplyHelper' });
                    }
                });
                window.close();
                break;
            case 'post':
                chrome.tabs.create({ url: `${API_BASE}/posts/new` });
                break;
            case 'profile':
                chrome.tabs.create({ url: `${API_BASE}/profile` });
                break;
            case 'job':
                chrome.tabs.create({ url: `${API_BASE}/jobs` });
                break;
        }
    };
    const openDashboard = () => {
        chrome.tabs.create({ url: `${API_BASE}/dashboard` });
    };
    const formatTime = (timestamp) => {
        if (!timestamp)
            return 'Chưa đồng bộ';
        const date = new Date(timestamp);
        return date.toLocaleString('vi-VN');
    };
    if (isLoading) {
        return (_jsx("div", { className: "min-h-[480px] flex items-center justify-center bg-dark-bg", children: _jsxs("div", { className: "text-center", children: [_jsx(RefreshCw, { className: "w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" }), _jsx("p", { className: "text-gray-400 text-sm", children: "\u0110ang ki\u1EC3m tra..." })] }) }));
    }
    return (_jsxs("div", { className: "min-h-[480px] flex flex-col bg-dark-bg", children: [_jsxs("header", { className: "p-4 border-b border-dark-border flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Sparkles, { className: "w-6 h-6 text-primary-500" }), _jsx("span", { className: "font-bold text-lg bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent", children: "LinkedBoost AI" })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: handleRefresh, className: "p-2 hover:bg-dark-card rounded-lg transition-colors", title: "L\u00E0m m\u1EDBi", children: _jsx(RefreshCw, { className: `w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}` }) }), user.isLoggedIn && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => chrome.tabs.create({ url: `${API_BASE}/settings` }), className: "p-2 hover:bg-dark-card rounded-lg transition-colors", title: "C\u00E0i \u0111\u1EB7t", children: _jsx(Settings, { className: "w-4 h-4 text-gray-400" }) }), _jsx("button", { onClick: handleLogout, className: "p-2 hover:bg-red-500/20 rounded-lg transition-colors", title: "\u0110\u0103ng xu\u1EA5t", children: _jsx(LogOut, { className: "w-4 h-4 text-gray-400 hover:text-red-400" }) })] }))] })] }), _jsx("main", { className: "flex-1 p-4 space-y-4 overflow-y-auto", children: !user.isLoggedIn ? (
                /* Not Logged In State */
                _jsxs("div", { className: "flex flex-col items-center justify-center h-full py-8 text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center mb-4", children: _jsx(Zap, { className: "w-8 h-8 text-white" }) }), _jsx("h2", { className: "text-xl font-bold mb-2 text-white", children: "Ch\u00E0o M\u1EEBng!" }), _jsx("p", { className: "text-gray-400 text-sm mb-6 px-4", children: "\u0110\u0103ng nh\u1EADp \u0111\u1EC3 s\u1EED d\u1EE5ng c\u00E1c c\u00F4ng c\u1EE5 AI cho LinkedIn" }), _jsxs("button", { onClick: handleLogin, className: "w-full max-w-xs py-3 px-6 bg-linkedin hover:bg-linkedin/90 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2", children: [_jsx("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" }) }), "\u0110\u0103ng Nh\u1EADp v\u1EDBi LinkedIn"] }), _jsx("div", { className: "mt-4", children: _jsx("button", { onClick: () => chrome.tabs.create({ url: `${API_BASE}/login` }), className: "text-sm text-gray-400 hover:text-primary-400 transition-colors", children: "Ho\u1EB7c \u0111\u0103ng nh\u1EADp v\u1EDBi Google" }) }), _jsxs("p", { className: "text-xs text-gray-500 mt-6 px-4", children: ["\uD83D\uDCA1 Sau khi \u0111\u0103ng nh\u1EADp tr\u00EAn web, nh\u1EA5n n\u00FAt ", _jsx(RefreshCw, { className: "w-3 h-3 inline" }), " \u0111\u1EC3 c\u1EADp nh\u1EADt"] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-3 p-3 bg-dark-card rounded-xl", children: [user.image ? (_jsx("img", { src: user.image, alt: user.name, className: "w-10 h-10 rounded-full" })) : (_jsx("div", { className: "w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold", children: user.name?.charAt(0) || 'U' }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium truncate text-white", children: user.name || 'User' }), _jsx("p", { className: "text-xs text-gray-400 truncate", children: user.email })] }), _jsx("span", { className: `flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.plan === 'PREMIUM'
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : user.plan === 'PRO'
                                            ? 'bg-primary-500/20 text-primary-400'
                                            : 'bg-gray-500/20 text-gray-400'}`, children: user.plan === 'FREE' ? 'Miễn Phí' : user.plan })] }), _jsx("div", { className: `p-3 rounded-xl border ${linkedInSession.isLoggedIn
                                ? 'bg-blue-500/10 border-blue-500/30'
                                : 'bg-gray-500/10 border-gray-500/30'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex items-center gap-2", children: linkedInSession.isLoggedIn ? (_jsxs(_Fragment, { children: [_jsx(Link2, { className: "w-5 h-5 text-blue-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-blue-400", children: "\u0110\u00E3 K\u1EBFt N\u1ED1i LinkedIn" }), _jsx("p", { className: "text-xs text-gray-400", children: linkedInSession.userName || 'Tài khoản đã đăng nhập' })] })] })) : (_jsxs(_Fragment, { children: [_jsx(Link2Off, { className: "w-5 h-5 text-gray-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-400", children: "Ch\u01B0a K\u1EBFt N\u1ED1i LinkedIn" }), _jsx("p", { className: "text-xs text-gray-500", children: "M\u1EDF LinkedIn \u0111\u1EC3 k\u1EBFt n\u1ED1i" })] })] })) }), !linkedInSession.isLoggedIn && (_jsx("button", { onClick: () => chrome.tabs.create({ url: 'https://www.linkedin.com/login' }), className: "px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors", children: "\u0110\u0103ng Nh\u1EADp" }))] }) }), _jsx("div", { className: `p-3 rounded-xl border ${user.profile?.synced
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-amber-500/10 border-amber-500/30'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex items-center gap-2", children: user.profile?.synced ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-green-400", children: "Profile \u0110\u00E3 \u0110\u1ED3ng B\u1ED9" }), _jsx("p", { className: "text-xs text-gray-400", children: formatTime(user.profile.lastSyncTime) })] })] })) : (_jsxs(_Fragment, { children: [_jsx(AlertCircle, { className: "w-5 h-5 text-amber-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-amber-400", children: "Ch\u01B0a \u0110\u1ED3ng B\u1ED9 Profile" }), _jsx("p", { className: "text-xs text-gray-400", children: "M\u1EDF trang profile LinkedIn" })] })] })) }), _jsx("button", { onClick: handleSyncProfile, disabled: isSyncing, className: "p-2 hover:bg-white/10 rounded-lg transition-colors", title: "\u0110\u1ED3ng b\u1ED9 profile", children: _jsx(RefreshCw, { className: `w-4 h-4 text-gray-400 ${isSyncing ? 'animate-spin' : ''}` }) })] }) }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: features.map((feature) => (_jsxs("button", { onClick: () => handleFeatureClick(feature.id), className: "p-4 bg-dark-card hover:bg-dark-border rounded-xl transition-all text-left group", children: [_jsx("div", { className: `w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`, children: _jsx(feature.icon, { className: "w-5 h-5 text-white" }) }), _jsx("h3", { className: "font-semibold text-sm mb-1 text-white", children: feature.title }), _jsx("p", { className: "text-xs text-gray-400", children: feature.description })] }, feature.id))) }), user.usage && (_jsxs("div", { className: "p-4 bg-dark-card rounded-xl space-y-3", children: [_jsx("h4", { className: "text-sm font-medium text-gray-300", children: "S\u1EED D\u1EE5ng H\u00F4m Nay" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-gray-400", children: "AI Replies" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-20 h-1.5 bg-dark-border rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-blue-500", style: { width: `${Math.min((user.usage.replies.used / user.usage.replies.limit) * 100, 100)}%` } }) }), _jsxs("span", { className: "font-medium text-white w-10 text-right", children: [user.usage.replies.used, "/", user.usage.replies.limit] })] })] }), _jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-gray-400", children: "B\u00E0i Vi\u1EBFt" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-20 h-1.5 bg-dark-border rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-purple-500", style: { width: `${Math.min((user.usage.posts.used / user.usage.posts.limit) * 100, 100)}%` } }) }), _jsxs("span", { className: "font-medium text-white w-10 text-right", children: [user.usage.posts.used, "/", user.usage.posts.limit] })] })] }), _jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-gray-400", children: "Job Matches" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-20 h-1.5 bg-dark-border rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-green-500", style: { width: `${Math.min((user.usage.jobMatches.used / user.usage.jobMatches.limit) * 100, 100)}%` } }) }), _jsxs("span", { className: "font-medium text-white w-10 text-right", children: [user.usage.jobMatches.used, "/", user.usage.jobMatches.limit] })] })] })] })] })), user.plan === 'FREE' && (_jsxs("div", { className: "p-4 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-xl border border-primary-500/30", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Crown, { className: "w-5 h-5 text-primary-400" }), _jsx("span", { className: "font-semibold text-sm text-white", children: "N\u00E2ng C\u1EA5p Pro" })] }), _jsx("p", { className: "text-xs text-gray-400 mb-3", children: "Kh\u00F4ng gi\u1EDBi h\u1EA1n AI features v\u00E0 h\u1ED7 tr\u1EE3 \u01B0u ti\u00EAn" }), _jsx("button", { onClick: () => chrome.tabs.create({ url: `${API_BASE}/settings?tab=billing` }), className: "w-full py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors", children: "Xem C\u00E1c G\u00F3i" })] }))] })) }), _jsx("footer", { className: "p-4 border-t border-dark-border", children: _jsxs("button", { onClick: openDashboard, className: "w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2", children: ["M\u1EDF Dashboard", _jsx(ExternalLink, { className: "w-4 h-4" })] }) })] }));
}
//# sourceMappingURL=App.js.map