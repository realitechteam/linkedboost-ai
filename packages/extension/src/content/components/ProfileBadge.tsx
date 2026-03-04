import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, ExternalLink } from 'lucide-react';
import { API_BASE } from '../../lib/constants';

interface ProfileBadgeProps {
    profileData: Record<string, unknown>;
}

interface AnalysisResult {
    overallScore: number;
    sections: {
        headline: { score: number; maxScore: number };
        about: { score: number; maxScore: number };
        experience: { score: number; maxScore: number };
        skills: { score: number; maxScore: number };
    };
    topSuggestions: string[];
}

export function ProfileBadge({ profileData }: ProfileBadgeProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
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
            } else {
                setIsMock(true);
                setAnalysis(generateMockAnalysis());
            }
        } catch (error) {
            console.error('Profile analysis failed:', error);
            // Use mock data for demo
            setIsMock(true);
            setAnalysis(generateMockAnalysis());
        } finally {
            setIsLoading(false);
        }
    };

    const generateMockAnalysis = (): AnalysisResult => {
        // Generate realistic mock analysis based on profile data
        const hasHeadline = Boolean(profileData.headline);
        const hasAbout = Boolean(profileData.about);
        const experienceCount = (profileData.experience as unknown[])?.length || 0;
        const skillsCount = (profileData.skills as unknown[])?.length || 0;

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
            ].filter(Boolean) as string[],
        };
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'high';
        if (score >= 50) return 'medium';
        return 'low';
    };

    const openDashboard = () => {
        chrome.tabs.create({
            url: `${API_BASE}/profile?url=${encodeURIComponent(window.location.href)}`
        });
    };

    if (isLoading) {
        return (
            <div className="linkedboost-profile-badge">
                <Loader2 className="animate-spin" size={24} color="#0ea5e9" />
                <div className="linkedboost-badge-content">
                    <span className="linkedboost-badge-title">Analyzing profile...</span>
                    <span className="linkedboost-badge-subtitle">Please wait</span>
                </div>
            </div>
        );
    }

    if (!analysis) {
        return null;
    }

    return (
        <div
            className="linkedboost-profile-badge"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
                flexDirection: isExpanded ? 'column' : 'row',
                alignItems: isExpanded ? 'stretch' : 'center',
                width: isExpanded ? '320px' : 'auto',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className={`linkedboost-score-circle ${getScoreColor(analysis.overallScore)}`}>
                    {analysis.overallScore}
                </div>
                <div className="linkedboost-badge-content">
                    <span className="linkedboost-badge-title">Profile Score</span>
                    <span className="linkedboost-badge-subtitle">
                        <TrendingUp size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        Click for details
                    </span>
                    {isMock && (
                        <span style={{ fontSize: '10px', color: '#f59e0b', display: 'block', marginTop: '2px' }}>
                            (Ước tính - kết nối server để xem kết quả chính xác)
                        </span>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div style={{ marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
                    {/* Section scores */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                        {Object.entries(analysis.sections).map(([key, value]) => (
                            <div
                                key={key}
                                style={{
                                    padding: '8px 12px',
                                    background: '#0f172a',
                                    borderRadius: '8px',
                                }}
                            >
                                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize' }}>
                                    {key}
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>
                                    {value.score}/{value.maxScore}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Top suggestions */}
                    {analysis.topSuggestions.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#f8fafc', marginBottom: '8px' }}>
                                Top Suggestions
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {analysis.topSuggestions.slice(0, 2).map((suggestion, index) => (
                                    <li
                                        key={index}
                                        style={{
                                            fontSize: '12px',
                                            color: '#94a3b8',
                                            padding: '6px 0',
                                            borderBottom: index < analysis.topSuggestions.length - 1 ? '1px solid #334155' : 'none',
                                        }}
                                    >
                                        • {suggestion}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            openDashboard();
                        }}
                        style={{
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
                        }}
                    >
                        View Full Analysis
                        <ExternalLink size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
