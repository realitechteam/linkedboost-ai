"use client";

import { useState, useEffect } from "react";
import {
    User,
    Loader2,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Lightbulb,
    ExternalLink,
    RefreshCw,
    Briefcase,
    Award,
    Link as LinkIcon,
    ArrowRight,
    Info,
} from "lucide-react";

interface ProfileSection {
    score: number;
    maxScore: number;
    feedback: string[];
}

interface ProfileAnalysis {
    overallScore: number;
    sections: {
        photo: ProfileSection;
        headline: ProfileSection;
        about: ProfileSection;
        experience: ProfileSection;
        skills: ProfileSection;
        other: ProfileSection;
    };
    suggestions: {
        section: string;
        priority: "high" | "medium" | "low";
        suggestion: string;
        example?: string;
    }[];
}

interface SyncedProfile {
    id: string;
    profileUrl: string;
    headline: string | null;
    about: string | null;
    experience: { title?: string; company?: string }[] | null;
    skills: string[];
    education: { school?: string; degree?: string }[] | null;
    lastSyncedAt: string | null;
}

interface FetchedProfile {
    name: string;
    headline: string;
    about: string;
    profileUrl: string;
    skills: string[];
}

type FetchStatus = "idle" | "loading" | "success" | "error";

export default function ProfileOptimizerPage() {
    const [profileUrl, setProfileUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
    const [isFetchingSynced, setIsFetchingSynced] = useState(true);
    const [syncedProfile, setSyncedProfile] = useState<SyncedProfile | null>(null);
    const [fetchedProfile, setFetchedProfile] = useState<FetchedProfile | null>(null);
    const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch synced profile on load
    useEffect(() => {
        fetchSyncedProfile();
    }, []);

    const fetchSyncedProfile = async () => {
        setIsFetchingSynced(true);
        try {
            const response = await fetch("/api/profile/sync");
            const data = await response.json();
            if (data.success && data.data) {
                setSyncedProfile(data.data);
                if (data.data.profileUrl) {
                    setProfileUrl(data.data.profileUrl);
                }
            }
        } catch (err) {
            console.error("Failed to fetch synced profile", err);
        } finally {
            setIsFetchingSynced(false);
        }
    };

    const handleFetchFromUrl = async () => {
        if (!profileUrl.includes("linkedin.com/in/")) {
            setError("Vui lòng nhập URL LinkedIn hợp lệ (linkedin.com/in/...)");
            return;
        }

        setFetchStatus("loading");
        setError(null);

        try {
            const response = await fetch("/api/profile/fetch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileUrl }),
            });

            const data = await response.json();

            if (!data.success) {
                // LinkedIn blocks direct requests, recommend extension
                setFetchStatus("error");
                setError("LinkedIn chặn truy cập trực tiếp. Vui lòng sử dụng Extension để đồng bộ profile.");
                return;
            }

            setFetchedProfile(data.data);
            setFetchStatus("success");
        } catch (err) {
            setFetchStatus("error");
            setError("LinkedIn chặn truy cập trực tiếp. Vui lòng cài Extension và mở profile LinkedIn của bạn để đồng bộ.");
        }
    };

    const handleAnalyze = async () => {
        const profileData = syncedProfile ? {
            headline: syncedProfile.headline || "",
            about: syncedProfile.about || "",
            experience: syncedProfile.experience || [],
            skills: syncedProfile.skills || [],
            hasPhoto: true,
        } : fetchedProfile ? {
            headline: fetchedProfile.headline || "",
            about: fetchedProfile.about || "",
            experience: [],
            skills: fetchedProfile.skills || [],
            hasPhoto: true,
        } : null;

        if (!profileData) {
            setError("Vui lòng đồng bộ profile hoặc nhập URL để phân tích");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/ai/profile-analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    profileData,
                    profileUrl: syncedProfile?.profileUrl || fetchedProfile?.profileUrl || profileUrl,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || "Failed to analyze profile");
            }

            setAnalysis(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    };

    const getScoreColor = (score: number, max: number) => {
        const percentage = (score / max) * 100;
        if (percentage >= 80) return "text-green-600";
        if (percentage >= 50) return "text-amber-500";
        return "text-red-500";
    };

    const getOverallScoreColor = (score: number) => {
        if (score >= 80) return "from-green-500 to-emerald-500";
        if (score >= 50) return "from-amber-500 to-orange-500";
        return "from-red-500 to-pink-500";
    };

    const priorityColors = {
        high: "bg-red-50 text-red-700 border-red-200",
        medium: "bg-amber-50 text-amber-700 border-amber-200",
        low: "bg-blue-50 text-blue-700 border-blue-200",
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Chưa bao giờ";
        return new Date(dateStr).toLocaleString('vi-VN');
    };

    const hasProfileData = syncedProfile || fetchedProfile;

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <h1 className="text-2xl font-bold font-heading text-gray-900">Profile Optimizer</h1>

            {/* Hero Title */}
            <div className="text-center py-6">
                <h2 className="text-3xl font-bold font-heading">
                    Tối Ưu <span className="text-green-500">Hồ Sơ LinkedIn</span>
                </h2>
                <p className="text-gray-500 mt-2">
                    Phân tích và cải thiện hồ sơ của bạn để thu hút nhà tuyển dụng
                </p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                        <strong>Hướng dẫn:</strong> Nhập link profile LinkedIn để lấy thông tin,
                        hoặc cài Extension để tự động đồng bộ khi đăng nhập LinkedIn.
                    </div>
                </div>
            </div>

            {/* URL Fetch Section - Always visible */}
            <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-green-500" />
                    Lấy Profile Từ LinkedIn
                </h3>
                <div className="flex gap-3">
                    <input
                        type="url"
                        value={profileUrl}
                        onChange={(e) => setProfileUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/your-profile"
                        className="input flex-1"
                    />
                    <button
                        onClick={handleFetchFromUrl}
                        disabled={fetchStatus === "loading" || !profileUrl.includes("linkedin.com")}
                        className="btn btn-secondary whitespace-nowrap"
                    >
                        {fetchStatus === "loading" ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang lấy...
                            </>
                        ) : (
                            <>
                                <ArrowRight className="w-4 h-4" />
                                Lấy Thông Tin
                            </>
                        )}
                    </button>
                </div>
                {fetchStatus === "success" && fetchedProfile && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Đã lấy thông tin: <strong>{fetchedProfile.name}</strong>
                        {fetchedProfile.headline && <span className="text-gray-500">- {fetchedProfile.headline.slice(0, 50)}...</span>}
                    </div>
                )}
            </div>

            {/* Synced Profile Card */}
            {isFetchingSynced ? (
                <div className="card animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-200" />
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                    </div>
                </div>
            ) : syncedProfile ? (
                <div className="card border-green-200 bg-green-50/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Profile Đã Đồng Bộ Từ Extension</span>
                        </div>
                        <button
                            onClick={fetchSyncedProfile}
                            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Làm mới
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Headline */}
                        {syncedProfile.headline && (
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wide">Tiêu đề</label>
                                <p className="text-lg font-medium text-gray-900">{syncedProfile.headline}</p>
                            </div>
                        )}

                        {/* About Preview */}
                        {syncedProfile.about && (
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wide">Giới thiệu</label>
                                <p className="text-gray-600 line-clamp-2">{syncedProfile.about}</p>
                            </div>
                        )}

                        {/* Experience & Skills */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                    <Briefcase className="w-3 h-3" />
                                    Kinh nghiệm
                                </label>
                                <div className="mt-1 space-y-1">
                                    {syncedProfile.experience?.slice(0, 3).map((exp, i) => (
                                        <div key={i} className="text-sm">
                                            <span className="text-gray-700">{exp.title}</span>
                                            {exp.company && (
                                                <span className="text-gray-500"> tại {exp.company}</span>
                                            )}
                                        </div>
                                    ))}
                                    {(!syncedProfile.experience || syncedProfile.experience.length === 0) && (
                                        <span className="text-gray-400 text-sm">Chưa có dữ liệu</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                    <Award className="w-3 h-3" />
                                    Kỹ năng ({syncedProfile.skills?.length || 0})
                                </label>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {syncedProfile.skills?.slice(0, 5).map((skill, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                            {skill}
                                        </span>
                                    ))}
                                    {syncedProfile.skills?.length > 5 && (
                                        <span className="text-gray-400 text-xs">+{syncedProfile.skills.length - 5} khác</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-green-200">
                            <span className="text-xs text-gray-500">
                                Đồng bộ lần cuối: {formatDate(syncedProfile.lastSyncedAt)}
                            </span>
                            <a
                                href={syncedProfile.profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:underline flex items-center gap-1"
                            >
                                Xem trên LinkedIn <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>
            ) : fetchedProfile ? (
                <div className="card border-blue-200 bg-blue-50/50">
                    <div className="flex items-center gap-2 text-blue-600 mb-3">
                        <User className="w-5 h-5" />
                        <span className="font-medium">Profile Đã Lấy Từ URL</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-900">{fetchedProfile.name}</p>
                        {fetchedProfile.headline && (
                            <p className="text-gray-600">{fetchedProfile.headline}</p>
                        )}
                        {fetchedProfile.about && (
                            <p className="text-sm text-gray-500 line-clamp-3">{fetchedProfile.about}</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="card border-amber-200 bg-amber-50/50">
                    <div className="flex items-center gap-3 text-amber-700 mb-3">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Chưa Có Dữ Liệu Profile</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Nhập URL profile LinkedIn ở trên hoặc cài đặt Chrome Extension để tự động đồng bộ.
                    </p>
                </div>
            )}

            {/* Analyze Button */}
            {hasProfileData && !analysis && (
                <div className="text-center">
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="btn btn-primary text-lg px-8 py-4"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Đang Phân Tích Profile...
                            </>
                        ) : (
                            <>
                                <TrendingUp className="w-6 h-6" />
                                Phân Tích Profile Với AI
                            </>
                        )}
                    </button>
                </div>
            )}

            {error && (
                <div className="card bg-red-50 border-red-200">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                </div>
            )}

            {analysis && (
                <div className="space-y-6">
                    {/* Overall Score */}
                    <div className="card text-center py-8">
                        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getOverallScoreColor(analysis.overallScore)} mb-4`}>
                            <span className="text-5xl font-bold text-white">{analysis.overallScore}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Điểm Hồ Sơ</h2>
                        <p className="text-gray-500">
                            {analysis.overallScore >= 80
                                ? "Tuyệt vời! Hồ sơ của bạn đã được tối ưu tốt."
                                : analysis.overallScore >= 50
                                    ? "Khá tốt! Còn một số điểm cần cải thiện."
                                    : "Cần cải thiện. Hãy làm theo gợi ý bên dưới."}
                        </p>
                    </div>

                    {/* Section Breakdown */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân Tích Chi Tiết</h3>
                        <div className="space-y-4">
                            {Object.entries(analysis.sections).map(([key, section]) => (
                                <div key={key} className="flex items-center gap-4">
                                    <div className="w-24 text-sm font-medium capitalize text-gray-700">{key}</div>
                                    <div className="flex-1">
                                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${(section.score / section.maxScore) >= 0.8
                                                    ? "bg-green-500"
                                                    : (section.score / section.maxScore) >= 0.5
                                                        ? "bg-amber-500"
                                                        : "bg-red-500"
                                                    }`}
                                                style={{ width: `${(section.score / section.maxScore) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className={`w-16 text-right font-medium ${getScoreColor(section.score, section.maxScore)}`}>
                                        {section.score}/{section.maxScore}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Suggestions */}
                    {analysis.suggestions.length > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-amber-500" />
                                Gợi Ý Cải Thiện
                            </h3>
                            <div className="space-y-4">
                                {analysis.suggestions.map((suggestion, i) => (
                                    <div
                                        key={i}
                                        className={`p-4 rounded-xl border ${priorityColors[suggestion.priority]}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium capitalize">{suggestion.section}</span>
                                                    <span className="text-xs uppercase opacity-70">
                                                        {suggestion.priority === "high" ? "Quan trọng" :
                                                            suggestion.priority === "medium" ? "Trung bình" : "Thấp"}
                                                    </span>
                                                </div>
                                                <p className="text-sm opacity-90">{suggestion.suggestion}</p>
                                                {suggestion.example && (
                                                    <p className="text-xs mt-2 opacity-70 italic">
                                                        Ví dụ: &quot;{suggestion.example}&quot;
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Muốn áp dụng những thay đổi này?</h3>
                                <p className="text-sm text-gray-500">
                                    Mở LinkedIn và sử dụng extension để apply các rewrite từ AI.
                                </p>
                            </div>
                            <a
                                href={syncedProfile?.profileUrl || fetchedProfile?.profileUrl || profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary whitespace-nowrap"
                            >
                                Mở LinkedIn
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
