import { useState, useEffect } from 'react';
import {
    Sparkles,
    MessageSquare,
    PenTool,
    User,
    Briefcase,
    Settings,
    ExternalLink,
    Zap,
    Crown,
    CheckCircle,
    RefreshCw,
    AlertCircle,
    LogOut,
} from 'lucide-react';

const API_BASE = 'http://localhost:3001';

interface ProfileData {
    synced: boolean;
    name?: string;
    headline?: string;
    lastSyncTime?: number;
}

interface UserState {
    isLoggedIn: boolean;
    name?: string;
    email?: string;
    image?: string;
    plan?: 'FREE' | 'PRO' | 'PREMIUM';
    profile?: ProfileData;
    usage?: {
        replies: { used: number; limit: number };
        posts: { used: number; limit: number };
        profileReviews: { used: number; limit: number };
        jobMatches: { used: number; limit: number };
    };
}

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
    const [user, setUser] = useState<UserState>({
        isLoggedIn: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        checkSession();
    }, []);

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
                        token: 'session-active',
                    });
                } else {
                    // Check local storage fallback
                    loadFromLocalStorage();
                }
            } else {
                loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Session check failed:', error);
            loadFromLocalStorage();
        } finally {
            setIsLoading(false);
        }
    };

    const loadFromLocalStorage = () => {
        chrome.storage.local.get(['user', 'token', 'profileSynced', 'lastSyncTime', 'profileData'], (result) => {
            if (result.user && result.token) {
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
        chrome.storage.local.remove(['user', 'token', 'profileSynced', 'lastSyncTime', 'profileData'], () => {
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
            } else {
                // Not on profile page, open one
                console.log('Not on LinkedIn profile page, opening...');
                chrome.tabs.create({ url: 'https://www.linkedin.com/in/me/' });
                setIsSyncing(false);
            }
        });
    };

    const handleFeatureClick = (featureId: string) => {
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

    const formatTime = (timestamp?: number) => {
        if (!timestamp) return 'Chưa đồng bộ';
        const date = new Date(timestamp);
        return date.toLocaleString('vi-VN');
    };

    if (isLoading) {
        return (
            <div className="min-h-[480px] flex items-center justify-center bg-dark-bg">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Đang kiểm tra...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[480px] flex flex-col bg-dark-bg">
            {/* Header */}
            <header className="p-4 border-b border-dark-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary-500" />
                    <span className="font-bold text-lg bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                        LinkedBoost AI
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-dark-card rounded-lg transition-colors"
                        title="Làm mới"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    {user.isLoggedIn && (
                        <>
                            <button
                                onClick={() => chrome.tabs.create({ url: `${API_BASE}/settings` })}
                                className="p-2 hover:bg-dark-card rounded-lg transition-colors"
                                title="Cài đặt"
                            >
                                <Settings className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Đăng xuất"
                            >
                                <LogOut className="w-4 h-4 text-gray-400 hover:text-red-400" />
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 space-y-4 overflow-y-auto">
                {!user.isLoggedIn ? (
                    /* Not Logged In State */
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center mb-4">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-white">Chào Mừng!</h2>
                        <p className="text-gray-400 text-sm mb-6 px-4">
                            Đăng nhập để sử dụng các công cụ AI cho LinkedIn
                        </p>
                        <button
                            onClick={handleLogin}
                            className="w-full max-w-xs py-3 px-6 bg-linkedin hover:bg-linkedin/90 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            Đăng Nhập với LinkedIn
                        </button>

                        <div className="mt-4">
                            <button
                                onClick={() => chrome.tabs.create({ url: `${API_BASE}/login` })}
                                className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
                            >
                                Hoặc đăng nhập với Google
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mt-6 px-4">
                            💡 Sau khi đăng nhập trên web, nhấn nút <RefreshCw className="w-3 h-3 inline" /> để cập nhật
                        </p>
                    </div>
                ) : (
                    <>
                        {/* User Info Bar */}
                        <div className="flex items-center gap-3 p-3 bg-dark-card rounded-xl">
                            {user.image ? (
                                <img
                                    src={user.image}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                                    <span className="text-white font-bold">
                                        {user.name?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-white">{user.name || 'User'}</p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.plan === 'PREMIUM'
                                ? 'bg-purple-500/20 text-purple-400'
                                : user.plan === 'PRO'
                                    ? 'bg-primary-500/20 text-primary-400'
                                    : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                {user.plan === 'FREE' ? 'Miễn Phí' : user.plan}
                            </span>
                        </div>

                        {/* Profile Sync Status */}
                        <div className={`p-3 rounded-xl border ${user.profile?.synced
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-amber-500/10 border-amber-500/30'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {user.profile?.synced ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                            <div>
                                                <p className="text-sm font-medium text-green-400">Profile Đã Đồng Bộ</p>
                                                <p className="text-xs text-gray-400">
                                                    {formatTime(user.profile.lastSyncTime)}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-5 h-5 text-amber-400" />
                                            <div>
                                                <p className="text-sm font-medium text-amber-400">Chưa Đồng Bộ Profile</p>
                                                <p className="text-xs text-gray-400">Mở trang profile LinkedIn</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={handleSyncProfile}
                                    disabled={isSyncing}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Đồng bộ profile"
                                >
                                    <RefreshCw className={`w-4 h-4 text-gray-400 ${isSyncing ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {features.map((feature) => (
                                <button
                                    key={feature.id}
                                    onClick={() => handleFeatureClick(feature.id)}
                                    className="p-4 bg-dark-card hover:bg-dark-border rounded-xl transition-all text-left group"
                                >
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                        <feature.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-sm mb-1 text-white">{feature.title}</h3>
                                    <p className="text-xs text-gray-400">{feature.description}</p>
                                </button>
                            ))}
                        </div>

                        {/* Usage Stats */}
                        {user.usage && (
                            <div className="p-4 bg-dark-card rounded-xl space-y-3">
                                <h4 className="text-sm font-medium text-gray-300">Sử Dụng Hôm Nay</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400">AI Replies</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-dark-border rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{ width: `${Math.min((user.usage.replies.used / user.usage.replies.limit) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="font-medium text-white w-10 text-right">
                                                {user.usage.replies.used}/{user.usage.replies.limit}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400">Bài Viết</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-dark-border rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-500"
                                                    style={{ width: `${Math.min((user.usage.posts.used / user.usage.posts.limit) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="font-medium text-white w-10 text-right">
                                                {user.usage.posts.used}/{user.usage.posts.limit}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400">Job Matches</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-dark-border rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500"
                                                    style={{ width: `${Math.min((user.usage.jobMatches.used / user.usage.jobMatches.limit) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="font-medium text-white w-10 text-right">
                                                {user.usage.jobMatches.used}/{user.usage.jobMatches.limit}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Upgrade CTA for Free users */}
                        {user.plan === 'FREE' && (
                            <div className="p-4 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-xl border border-primary-500/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Crown className="w-5 h-5 text-primary-400" />
                                    <span className="font-semibold text-sm text-white">Nâng Cấp Pro</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-3">
                                    Không giới hạn AI features và hỗ trợ ưu tiên
                                </p>
                                <button
                                    onClick={() => chrome.tabs.create({ url: `${API_BASE}/settings?tab=billing` })}
                                    className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Xem Các Gói
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="p-4 border-t border-dark-border">
                <button
                    onClick={openDashboard}
                    className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    Mở Dashboard
                    <ExternalLink className="w-4 h-4" />
                </button>
            </footer>
        </div>
    );
}
