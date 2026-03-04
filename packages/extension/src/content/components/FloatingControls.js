import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// Floating Control Panel for LinkedBoost AI on LinkedIn
import { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, PenTool, User, Briefcase, X, ChevronUp, ChevronDown, RefreshCw, Check, AlertCircle, } from 'lucide-react';
import { API_BASE } from '../../lib/constants';
export function FloatingControls({ isAuthenticated, isProfileSynced, onSyncProfile, onEnableReply, onAnalyzeProfile, onAnalyzeJob, onOpenDashboard, }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pageType, setPageType] = useState('other');
    const lastUrlRef = useRef(window.location.href);
    useEffect(() => {
        function detectPageTypeFromUrl(url) {
            if (url.includes('/in/')) {
                setPageType('profile');
            }
            else if (url.includes('/messaging/')) {
                setPageType('messaging');
            }
            else if (url.includes('/jobs/')) {
                setPageType('job');
            }
            else {
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
        return (_jsx("button", { onClick: () => setIsMinimized(false), className: "linkedboost-fab", title: "M\u1EDF LinkedBoost AI", children: _jsx(Sparkles, { className: "w-5 h-5" }) }));
    }
    return (_jsxs("div", { className: "linkedboost-floating-panel", children: [_jsxs("div", { className: "linkedboost-panel-header", children: [_jsxs("div", { className: "linkedboost-panel-title", children: [_jsx(Sparkles, { className: "w-4 h-4" }), _jsx("span", { children: "LinkedBoost AI" })] }), _jsxs("div", { className: "linkedboost-panel-actions", children: [_jsx("button", { onClick: () => setIsExpanded(!isExpanded), className: "linkedboost-icon-btn", title: isExpanded ? "Thu gọn" : "Mở rộng", children: isExpanded ? _jsx(ChevronDown, { className: "w-4 h-4" }) : _jsx(ChevronUp, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setIsMinimized(true), className: "linkedboost-icon-btn", title: "Thu nh\u1ECF", children: _jsx(X, { className: "w-4 h-4" }) })] })] }), isExpanded && (_jsx("div", { className: "linkedboost-panel-content", children: !isAuthenticated ? (_jsxs("div", { className: "linkedboost-auth-prompt", children: [_jsx(AlertCircle, { className: "w-8 h-8 text-amber-400" }), _jsx("p", { children: "Vui l\u00F2ng \u0111\u0103ng nh\u1EADp \u0111\u1EC3 s\u1EED d\u1EE5ng" }), _jsx("button", { onClick: onOpenDashboard, className: "linkedboost-btn linkedboost-btn-primary", children: "\u0110\u0103ng Nh\u1EADp" })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: `linkedboost-status ${isProfileSynced ? 'synced' : 'not-synced'}`, children: isProfileSynced ? (_jsxs(_Fragment, { children: [_jsx(Check, { className: "w-4 h-4" }), _jsx("span", { children: "Profile \u0111\u00E3 \u0111\u1ED3ng b\u1ED9" })] })) : (_jsxs(_Fragment, { children: [_jsx(AlertCircle, { className: "w-4 h-4" }), _jsx("span", { children: "Ch\u01B0a \u0111\u1ED3ng b\u1ED9 profile" })] })) }), _jsxs("div", { className: "linkedboost-actions", children: [pageType === 'profile' && (_jsxs("button", { onClick: handleSyncClick, disabled: isSyncing, className: "linkedboost-btn linkedboost-btn-secondary", children: [_jsx(RefreshCw, { className: `w-4 h-4 ${isSyncing ? 'animate-spin' : ''}` }), _jsx("span", { children: isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Profile' })] })), pageType === 'messaging' && (_jsxs("button", { onClick: onEnableReply, className: "linkedboost-btn linkedboost-btn-primary", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), _jsx("span", { children: "G\u1EE3i \u00DD Tr\u1EA3 L\u1EDDi AI" })] })), pageType === 'profile' && (_jsxs("button", { onClick: onAnalyzeProfile, className: "linkedboost-btn linkedboost-btn-primary", children: [_jsx(User, { className: "w-4 h-4" }), _jsx("span", { children: "Ph\u00E2n T\u00EDch Profile" })] })), pageType === 'job' && (_jsxs("button", { onClick: onAnalyzeJob, className: "linkedboost-btn linkedboost-btn-primary", children: [_jsx(Briefcase, { className: "w-4 h-4" }), _jsx("span", { children: "So Kh\u1EDBp C\u00F4ng Vi\u1EC7c" })] })), pageType === 'other' && (_jsx(_Fragment, { children: _jsxs("button", { onClick: () => chrome.tabs?.create?.({ url: `${API_BASE}/posts/new` }), className: "linkedboost-btn linkedboost-btn-secondary", children: [_jsx(PenTool, { className: "w-4 h-4" }), _jsx("span", { children: "Vi\u1EBFt B\u00E0i M\u1EDBi" })] }) })), _jsxs("button", { onClick: onOpenDashboard, className: "linkedboost-btn linkedboost-btn-outline", children: [_jsx(Sparkles, { className: "w-4 h-4" }), _jsx("span", { children: "M\u1EDF Dashboard" })] })] })] })) }))] }));
}
export default FloatingControls;
//# sourceMappingURL=FloatingControls.js.map