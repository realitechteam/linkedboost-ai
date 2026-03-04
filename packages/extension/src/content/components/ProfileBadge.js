import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, ExternalLink } from 'lucide-react';
import { API_BASE } from '../../lib/constants';
export function ProfileBadge({ profileData }) {
    const [isLoading, setIsLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMock, setIsMock] = useState(false);
    useEffect(() => {
        analyzeProfile();
    }, [profileData.name, profileData.headline]);
    const analyzeProfile = async () => {
        setIsLoading(true);
        setIsMock(false);
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'analyzeProfile',
                data: { profileData },
            });
            if (response.error) {
                throw new Error(response.error);
            }
            if (response.data) {
                setAnalysis(response.data);
            }
            else {
                setIsMock(true);
                setAnalysis(generateMockAnalysis());
            }
        }
        catch (error) {
            console.error('Profile analysis failed:', error);
            // Use mock data for demo
            setIsMock(true);
            setAnalysis(generateMockAnalysis());
        }
        finally {
            setIsLoading(false);
        }
    };
    const generateMockAnalysis = () => {
        // Generate realistic mock analysis based on profile data
        const hasHeadline = Boolean(profileData.headline);
        const hasAbout = Boolean(profileData.about);
        const experienceCount = profileData.experience?.length || 0;
        const skillsCount = profileData.skills?.length || 0;
        const headlineScore = hasHeadline ? 12 : 0;
        const aboutScore = hasAbout ? 18 : 0;
        const experienceScore = Math.min(experienceCount * 5, 25);
        const skillsScore = Math.min(skillsCount * 1.5, 15);
        const overallScore = headlineScore + aboutScore + experienceScore + skillsScore + 20; // +20 for having a profile
        return {
            overallScore: Math.round(overallScore),
            sections: {
                headline: { score: headlineScore, maxScore: 15 },
                about: { score: aboutScore, maxScore: 20 },
                experience: { score: experienceScore, maxScore: 25 },
                skills: { score: skillsScore, maxScore: 15 },
            },
            topSuggestions: [
                !hasAbout ? 'Add a compelling About section with your value proposition' : null,
                skillsCount < 10 ? 'Add more relevant skills to increase visibility' : null,
                'Include quantified achievements in your experience',
            ].filter(Boolean),
        };
    };
    const getScoreColor = (score) => {
        if (score >= 80)
            return 'high';
        if (score >= 50)
            return 'medium';
        return 'low';
    };
    const openDashboard = () => {
        chrome.tabs.create({
            url: `${API_BASE}/profile?url=${encodeURIComponent(window.location.href)}`
        });
    };
    if (isLoading) {
        return (_jsxs("div", { className: "linkedboost-profile-badge", children: [_jsx(Loader2, { className: "animate-spin", size: 24, color: "#0ea5e9" }), _jsxs("div", { className: "linkedboost-badge-content", children: [_jsx("span", { className: "linkedboost-badge-title", children: "Analyzing profile..." }), _jsx("span", { className: "linkedboost-badge-subtitle", children: "Please wait" })] })] }));
    }
    if (!analysis) {
        return null;
    }
    return (_jsxs("div", { className: "linkedboost-profile-badge", onClick: () => setIsExpanded(!isExpanded), style: {
            flexDirection: isExpanded ? 'column' : 'row',
            alignItems: isExpanded ? 'stretch' : 'center',
            width: isExpanded ? '320px' : 'auto',
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx("div", { className: `linkedboost-score-circle ${getScoreColor(analysis.overallScore)}`, children: analysis.overallScore }), _jsxs("div", { className: "linkedboost-badge-content", children: [_jsx("span", { className: "linkedboost-badge-title", children: "Profile Score" }), _jsxs("span", { className: "linkedboost-badge-subtitle", children: [_jsx(TrendingUp, { size: 12, style: { display: 'inline', marginRight: '4px' } }), "Click for details"] }), isMock && (_jsx("span", { style: { fontSize: '10px', color: '#f59e0b', display: 'block', marginTop: '2px' }, children: "(\u01AF\u1EDBc t\u00EDnh - k\u1EBFt n\u1ED1i server \u0111\u1EC3 xem k\u1EBFt qu\u1EA3 ch\u00EDnh x\u00E1c)" }))] })] }), isExpanded && (_jsxs("div", { style: { marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '16px' }, children: [_jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }, children: Object.entries(analysis.sections).map(([key, value]) => (_jsxs("div", { style: {
                                padding: '8px 12px',
                                background: '#0f172a',
                                borderRadius: '8px',
                            }, children: [_jsx("div", { style: { fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize' }, children: key }), _jsxs("div", { style: { fontSize: '14px', fontWeight: '600', color: '#f8fafc' }, children: [value.score, "/", value.maxScore] })] }, key))) }), analysis.topSuggestions.length > 0 && (_jsxs("div", { style: { marginBottom: '16px' }, children: [_jsx("div", { style: { fontSize: '12px', fontWeight: '600', color: '#f8fafc', marginBottom: '8px' }, children: "Top Suggestions" }), _jsx("ul", { style: { listStyle: 'none', padding: 0, margin: 0 }, children: analysis.topSuggestions.slice(0, 2).map((suggestion, index) => (_jsxs("li", { style: {
                                        fontSize: '12px',
                                        color: '#94a3b8',
                                        padding: '6px 0',
                                        borderBottom: index < analysis.topSuggestions.length - 1 ? '1px solid #334155' : 'none',
                                    }, children: ["\u2022 ", suggestion] }, index))) })] })), _jsxs("button", { onClick: (e) => {
                            e.stopPropagation();
                            openDashboard();
                        }, style: {
                            width: '100%',
                            padding: '10px',
                            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                        }, children: ["View Full Analysis", _jsx(ExternalLink, { size: 14 })] })] }))] }));
}
//# sourceMappingURL=ProfileBadge.js.map