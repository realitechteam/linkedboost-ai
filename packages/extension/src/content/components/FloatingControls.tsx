// Floating Control Panel for LinkedBoost AI on LinkedIn
import { useState, useEffect, useRef } from 'react';
import {
    Sparkles,
    MessageSquare,
    PenTool,
    User,
    Briefcase,
    X,
    ChevronUp,
    ChevronDown,
    RefreshCw,
    Check,
    AlertCircle,
} from 'lucide-react';
import { API_BASE } from '../../lib/constants';

interface FloatingControlsProps {
    isAuthenticated: boolean;
    isProfileSynced: boolean;
    onSyncProfile: () => void;
    onEnableReply: () => void;
    onAnalyzeProfile: () => void;
    onAnalyzeJob: () => void;
    onOpenDashboard: () => void;
}

export function FloatingControls({
    isAuthenticated,
    isProfileSynced,
    onSyncProfile,
    onEnableReply,
    onAnalyzeProfile,
    onAnalyzeJob,
    onOpenDashboard,
}: FloatingControlsProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pageType, setPageType] = useState<'profile' | 'messaging' | 'job' | 'other'>('other');
    const lastUrlRef = useRef(window.location.href);

    useEffect(() => {
        function detectPageTypeFromUrl(url: string) {
            if (url.includes('/in/')) {
                setPageType('profile');
            } else if (url.includes('/messaging/')) {
                setPageType('messaging');
            } else if (url.includes('/jobs/')) {
                setPageType('job');
            } else {
                setPageType('other');
            }
        }

        // Initial detection
        detectPageTypeFromUrl(window.location.href);

        // Poll for URL changes (LinkedIn SPA navigation)
        const interval = setInterval(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrlRef.current) {
                lastUrlRef.current = currentUrl;
                detectPageTypeFromUrl(currentUrl);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleSyncClick = async () => {
        setIsSyncing(true);
        await onSyncProfile();
        setTimeout(() => setIsSyncing(false), 2000);
    };

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="linkedboost-fab"
                title="Mở LinkedBoost AI"
            >
                <Sparkles className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="linkedboost-floating-panel">
            {/* Header */}
            <div className="linkedboost-panel-header">
                <div className="linkedboost-panel-title">
                    <Sparkles className="w-4 h-4" />
                    <span>LinkedBoost AI</span>
                </div>
                <div className="linkedboost-panel-actions">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="linkedboost-icon-btn"
                        title={isExpanded ? "Thu gọn" : "Mở rộng"}
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="linkedboost-icon-btn"
                        title="Thu nhỏ"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="linkedboost-panel-content">
                    {!isAuthenticated ? (
                        <div className="linkedboost-auth-prompt">
                            <AlertCircle className="w-8 h-8 text-amber-400" />
                            <p>Vui lòng đăng nhập để sử dụng</p>
                            <button
                                onClick={onOpenDashboard}
                                className="linkedboost-btn linkedboost-btn-primary"
                            >
                                Đăng Nhập
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Status Bar */}
                            <div className={`linkedboost-status ${isProfileSynced ? 'synced' : 'not-synced'}`}>
                                {isProfileSynced ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Profile đã đồng bộ</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Chưa đồng bộ profile</span>
                                    </>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="linkedboost-actions">
                                {/* Sync Profile - Always visible on profile pages */}
                                {pageType === 'profile' && (
                                    <button
                                        onClick={handleSyncClick}
                                        disabled={isSyncing}
                                        className="linkedboost-btn linkedboost-btn-secondary"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                        <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Profile'}</span>
                                    </button>
                                )}

                                {/* Reply Helper - On messaging pages */}
                                {pageType === 'messaging' && (
                                    <button
                                        onClick={onEnableReply}
                                        className="linkedboost-btn linkedboost-btn-primary"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        <span>Gợi Ý Trả Lời AI</span>
                                    </button>
                                )}

                                {/* Profile Analyzer - On profile pages */}
                                {pageType === 'profile' && (
                                    <button
                                        onClick={onAnalyzeProfile}
                                        className="linkedboost-btn linkedboost-btn-primary"
                                    >
                                        <User className="w-4 h-4" />
                                        <span>Phân Tích Profile</span>
                                    </button>
                                )}

                                {/* Job Matcher - On job pages */}
                                {pageType === 'job' && (
                                    <button
                                        onClick={onAnalyzeJob}
                                        className="linkedboost-btn linkedboost-btn-primary"
                                    >
                                        <Briefcase className="w-4 h-4" />
                                        <span>So Khớp Công Việc</span>
                                    </button>
                                )}

                                {/* Quick Actions for other pages */}
                                {pageType === 'other' && (
                                    <>
                                        <button
                                            onClick={() => chrome.tabs?.create?.({ url: `${API_BASE}/posts/new` })}
                                            className="linkedboost-btn linkedboost-btn-secondary"
                                        >
                                            <PenTool className="w-4 h-4" />
                                            <span>Viết Bài Mới</span>
                                        </button>
                                    </>
                                )}

                                {/* Dashboard Link */}
                                <button
                                    onClick={onOpenDashboard}
                                    className="linkedboost-btn linkedboost-btn-outline"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>Mở Dashboard</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default FloatingControls;
