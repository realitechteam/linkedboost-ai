"use client";

import { useState } from "react";
import {
    Briefcase,
    Loader2,
    TrendingUp,
    CheckCircle,
    X,
    ExternalLink,
    Target,
    AlertTriangle,
    FileEdit,
    Sparkles,
    Info,
    Link as LinkIcon,
    ArrowRight,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface JobMatchResult {
    overallScore: number;
    categories: {
        skills: { score: number; matched: string[]; missing: string[] };
        experience: { score: number; matched: string[]; missing: string[] };
        education: { score: number; matched: string[]; missing: string[] };
    };
    recommendations: string[];
}

interface FetchedJobData {
    title: string;
    company: string;
    location: string;
    description: string;
    jobUrl: string;
}

type AnalysisStatus = "idle" | "loading" | "success" | "error";
type FetchStatus = "idle" | "loading" | "success" | "error";

export default function JobMatcherPage() {
    const [jobUrl, setJobUrl] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [jobCompany, setJobCompany] = useState("");
    const [status, setStatus] = useState<AnalysisStatus>("idle");
    const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
    const [result, setResult] = useState<JobMatchResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFetchJob = async () => {
        if (!jobUrl.includes("linkedin.com/jobs/")) {
            setError("Vui lòng nhập URL job LinkedIn hợp lệ");
            return;
        }

        setFetchStatus("loading");
        setError(null);

        try {
            const response = await fetch("/api/jobs/fetch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobUrl }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || "Không thể lấy thông tin job");
            }

            const jobData: FetchedJobData = data.data;
            setJobTitle(jobData.title);
            setJobCompany(jobData.company);
            setJobDescription(jobData.description);
            setFetchStatus("success");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
            setFetchStatus("error");
        }
    };

    const handleAnalyze = async () => {
        if (!jobDescription.trim()) {
            setError("Vui lòng nhập mô tả công việc");
            return;
        }

        setStatus("loading");
        setError(null);

        try {
            const response = await fetch("/api/ai/job-match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobData: {
                        title: jobTitle || "Job Position",
                        company: jobCompany || "Company",
                        description: jobDescription,
                        jobUrl: jobUrl || undefined,
                    },
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || "Không thể phân tích");
            }

            setResult(data.data);
            setStatus("success");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
            setStatus("error");
        }
    };

    const getAllGaps = () => {
        if (!result) return [];
        const gaps: { category: string; items: string[] }[] = [];

        Object.entries(result.categories).forEach(([key, category]) => {
            if (category.missing.length > 0) {
                gaps.push({ category: key, items: category.missing });
            }
        });

        return gaps;
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "from-green-500 to-emerald-500";
        if (score >= 50) return "from-amber-500 to-orange-500";
        return "from-red-500 to-pink-500";
    };

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <h1 className="text-2xl font-bold font-heading text-gray-900">Job Matcher</h1>

            {/* Hero Title */}
            <div className="text-center py-6">
                <h2 className="text-3xl font-bold font-heading">
                    Công Cụ <span className="text-green-500">So Khớp Việc Làm</span>
                </h2>
                <p className="text-gray-500 mt-2">
                    Phân tích mức độ phù hợp giữa hồ sơ của bạn và yêu cầu công việc
                </p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                        <strong>Hướng dẫn:</strong> Paste link job từ LinkedIn để tự động lấy nội dung,
                        hoặc nhập trực tiếp mô tả công việc bên dưới.
                    </div>
                </div>
            </div>

            {/* URL Fetch Section */}
            <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-green-500" />
                    Lấy Thông Tin Từ LinkedIn
                </h3>
                <div className="flex gap-3">
                    <input
                        type="url"
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        placeholder="https://linkedin.com/jobs/view/..."
                        className="input flex-1"
                    />
                    <button
                        onClick={handleFetchJob}
                        disabled={fetchStatus === "loading" || !jobUrl.includes("linkedin.com")}
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
                {fetchStatus === "success" && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Đã lấy thông tin job: <strong>{jobTitle}</strong> tại <strong>{jobCompany}</strong>
                    </div>
                )}
            </div>

            {/* Job Details Input */}
            <div className="card space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vị Trí
                        </label>
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="Ví dụ: Senior Software Engineer"
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Công Ty
                        </label>
                        <input
                            type="text"
                            value={jobCompany}
                            onChange={(e) => setJobCompany(e.target.value)}
                            placeholder="Ví dụ: Google"
                            className="input"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô Tả Công Việc *
                    </label>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste nội dung mô tả công việc vào đây..."
                        className="input min-h-[200px] resize-none"
                    />
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={status === "loading" || !jobDescription.trim()}
                    className="btn btn-primary w-full py-4 text-lg"
                >
                    {status === "loading" ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang phân tích...
                        </>
                    ) : (
                        <>
                            <Target className="w-5 h-5" />
                            Phân Tích Mức Độ Phù Hợp
                        </>
                    )}
                </button>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* 3-Tab Results Section */}
            <Tabs defaultValue="fit" className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-6 bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger
                        value="fit"
                        className="flex items-center gap-2 rounded-lg py-2.5 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm transition-all"
                    >
                        <Target className="w-4 h-4" />
                        Phù Hợp
                    </TabsTrigger>
                    <TabsTrigger
                        value="gaps"
                        className="flex items-center gap-2 rounded-lg py-2.5 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm transition-all"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Thiếu Sót
                    </TabsTrigger>
                    <TabsTrigger
                        value="rewrite"
                        className="flex items-center gap-2 rounded-lg py-2.5 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
                    >
                        <FileEdit className="w-4 h-4" />
                        Gợi Ý
                    </TabsTrigger>
                </TabsList>

                {/* FIT TAB */}
                <TabsContent value="fit">
                    {status === "idle" && (
                        <div className="card text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <Briefcase className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Phân Tích Mức Độ Phù Hợp</h3>
                            <p className="text-gray-500">
                                Paste mô tả công việc phía trên để xem bạn phù hợp như thế nào
                            </p>
                        </div>
                    )}

                    {status === "loading" && (
                        <div className="card py-16 text-center">
                            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-green-500" />
                            <p className="text-gray-500">Đang phân tích với AI...</p>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="card bg-red-50 border-red-200 text-center py-8">
                            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-500" />
                            <p className="text-red-600 mb-4">{error}</p>
                            <button onClick={handleAnalyze} className="btn btn-secondary">
                                Thử lại
                            </button>
                        </div>
                    )}

                    {status === "success" && result && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Overall Score */}
                            <div className="card text-center py-8">
                                <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br ${getScoreColor(result.overallScore)} mb-4`}>
                                    <span className="text-4xl font-bold text-white">{result.overallScore}</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Điểm Phù Hợp</h2>
                                <p className="text-gray-500">
                                    {result.overallScore >= 80
                                        ? "Tuyệt vời! Bạn là ứng viên mạnh cho vị trí này."
                                        : result.overallScore >= 60
                                            ? "Khá tốt! Cải thiện một số điểm để nổi bật hơn."
                                            : result.overallScore >= 40
                                                ? "Phù hợp một phần. Xem xét bổ sung kỹ năng còn thiếu."
                                                : "Cần cải thiện nhiều. Hãy tham khảo các gợi ý."}
                                </p>
                            </div>

                            {/* Category Breakdown */}
                            <div className="grid md:grid-cols-3 gap-4">
                                {Object.entries(result.categories).map(([key, category]) => (
                                    <div key={key} className="card">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-gray-900 capitalize">
                                                {key === "skills" ? "Kỹ năng" : key === "experience" ? "Kinh nghiệm" : "Học vấn"}
                                            </h3>
                                            <span className={cn(
                                                "text-lg font-bold",
                                                category.score >= 80 ? "text-green-600" :
                                                    category.score >= 50 ? "text-amber-500" : "text-red-500"
                                            )}>
                                                {category.score}%
                                            </span>
                                        </div>

                                        {category.matched.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs text-gray-500 mb-2">Đã có</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {category.matched.slice(0, 4).map((item, i) => (
                                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md">
                                                            <CheckCircle className="w-3 h-3" />
                                                            {item}
                                                        </span>
                                                    ))}
                                                    {category.matched.length > 4 && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                                                            +{category.matched.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {category.missing.length > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-2">Còn thiếu</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {category.missing.slice(0, 3).map((item, i) => (
                                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs rounded-md">
                                                            <X className="w-3 h-3" />
                                                            {item}
                                                        </span>
                                                    ))}
                                                    {category.missing.length > 3 && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                                                            +{category.missing.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Apply CTA */}
                            {jobUrl && (
                                <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1">Sẵn sàng apply?</h3>
                                            <p className="text-sm text-gray-500">
                                                Xem tab Thiếu Sót và Gợi Ý trước khi nộp hồ sơ.
                                            </p>
                                        </div>
                                        <a
                                            href={jobUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary whitespace-nowrap"
                                        >
                                            Xem Job
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* GAPS TAB */}
                <TabsContent value="gaps">
                    {status === "idle" && (
                        <div className="card text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa Có Phân Tích</h3>
                            <p className="text-gray-500">
                                Chạy phân tích trước để xem các kỹ năng và kinh nghiệm còn thiếu
                            </p>
                        </div>
                    )}

                    {status === "loading" && (
                        <div className="card py-16 text-center">
                            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-amber-500" />
                            <p className="text-gray-500">Đang phân tích...</p>
                        </div>
                    )}

                    {status === "success" && result && (
                        <div className="space-y-4 animate-fade-in">
                            {getAllGaps().length === 0 ? (
                                <div className="card bg-green-50 border-green-200 text-center py-8">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Không Có Thiếu Sót Lớn!</h3>
                                    <p className="text-gray-500">
                                        Hồ sơ của bạn đáp ứng các yêu cầu chính của vị trí này.
                                    </p>
                                </div>
                            ) : (
                                getAllGaps().map((gap) => (
                                    <div key={gap.category} className="card">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                                            {gap.category === "skills" ? "Kỹ Năng Còn Thiếu" :
                                                gap.category === "experience" ? "Kinh Nghiệm Còn Thiếu" : "Học Vấn Còn Thiếu"}
                                        </h3>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {gap.items.map((item, i) => (
                                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                                                    <X className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="text-sm text-gray-700">{item}</span>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Nên bổ sung vào hồ sơ
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}

                            {result.recommendations.length > 0 && (
                                <div className="card">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-blue-500" />
                                        Đề Xuất Cải Thiện
                                    </h3>
                                    <ul className="space-y-3">
                                        {result.recommendations.map((rec, i) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-600">
                                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm flex items-center justify-center">
                                                    {i + 1}
                                                </span>
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* REWRITE TAB */}
                <TabsContent value="rewrite">
                    {status === "idle" && (
                        <div className="card text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <FileEdit className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Gợi Ý Viết Lại Với AI</h3>
                            <p className="text-gray-500">
                                Sau khi phân tích, nhận gợi ý AI để cải thiện các phần trong hồ sơ
                            </p>
                        </div>
                    )}

                    {status === "loading" && (
                        <div className="card py-16 text-center">
                            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
                            <p className="text-gray-500">Đang tạo gợi ý...</p>
                        </div>
                    )}

                    {status === "success" && result && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="card">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-orange-500" />
                                    Tối Ưu Headline
                                </h3>
                                <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
                                    <p className="text-sm text-gray-500 mb-2">Headline gợi ý:</p>
                                    <p className="font-medium text-gray-900">
                                        {result.categories.skills.matched.length > 0
                                            ? `${result.categories.skills.matched.slice(0, 3).join(" | ")} Expert | ${result.categories.experience.matched[0] || "Results-Driven Professional"}`
                                            : "Thêm kỹ năng của bạn để tạo headline tối ưu"}
                                    </p>
                                </div>
                                <button className="mt-4 btn btn-accent text-sm">
                                    <Sparkles className="w-4 h-4" />
                                    Tạo Thêm Biến Thể
                                </button>
                            </div>

                            <div className="card">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileEdit className="w-5 h-5 text-blue-500" />
                                    Từ Khóa Quan Trọng
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Thêm các từ khóa này vào hồ sơ để tăng điểm phù hợp:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {[...result.categories.skills.missing, ...result.categories.experience.missing]
                                        .slice(0, 8)
                                        .map((keyword, i) => (
                                            <span
                                                key={i}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-full text-sm font-medium border",
                                                    i < 3
                                                        ? "bg-red-50 border-red-200 text-red-600"
                                                        : "bg-amber-50 border-amber-200 text-amber-600"
                                                )}
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                </div>
                            </div>

                            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-center py-8">
                                <Sparkles className="w-10 h-10 mx-auto mb-3 text-indigo-500" />
                                <h3 className="font-semibold text-gray-900 mb-2">Muốn Viết Lại Toàn Bộ Profile?</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Sử dụng Profile Optimizer để nhận gợi ý AI toàn diện.
                                </p>
                                <a
                                    href="/profile"
                                    className="btn btn-primary inline-flex"
                                >
                                    Mở Profile Optimizer
                                </a>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
