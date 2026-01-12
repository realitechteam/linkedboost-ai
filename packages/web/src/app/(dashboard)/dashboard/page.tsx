import { auth } from "@/lib/auth";
import {
    MessageSquare,
    PenTool,
    User,
    Briefcase,
    TrendingUp,
    ExternalLink,
    Zap,
    Target,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await auth();

    // Mock data for development (no database required)
    const plan = "FREE";
    const usageData = {
        REPLY_SUGGEST: 2,
        POST_GENERATE: 1,
        PROFILE_ANALYZE: 0,
        JOB_MATCH: 1,
    };

    const userName = session?.user?.name?.split(" ")[0] || "User";

    // Relevant AI usage stats
    const stats = [
        {
            icon: MessageSquare,
            label: "AI Replies Hôm Nay",
            value: `${usageData.REPLY_SUGGEST}/5`,
            color: "green",
            progress: (usageData.REPLY_SUGGEST / 5) * 100,
        },
        {
            icon: PenTool,
            label: "Bài Viết Tháng Này",
            value: `${usageData.POST_GENERATE}/${plan === "FREE" ? 3 : 20}`,
            color: "purple",
            progress: (usageData.POST_GENERATE / (plan === "FREE" ? 3 : 20)) * 100,
        },
        {
            icon: User,
            label: "Profile Reviews",
            value: `${usageData.PROFILE_ANALYZE}/${plan === "FREE" ? 1 : "∞"}`,
            color: "orange",
            progress: plan === "FREE" ? (usageData.PROFILE_ANALYZE / 1) * 100 : 0,
        },
        {
            icon: Briefcase,
            label: "Job Matches",
            value: `${usageData.JOB_MATCH}/${plan === "FREE" ? 3 : 20}`,
            color: "blue",
            progress: (usageData.JOB_MATCH / (plan === "FREE" ? 3 : 20)) * 100,
        },
    ];

    const features = [
        {
            id: "post",
            icon: PenTool,
            title: "Viết Bài Viết",
            description: "Tạo bài viết LinkedIn chuyên nghiệp với AI",
            color: "purple",
            href: "/posts/new",
        },
        {
            id: "profile",
            icon: User,
            title: "Tối Ưu Profile",
            description: "Phân tích và cải thiện hồ sơ LinkedIn",
            color: "orange",
            href: "/profile",
        },
        {
            id: "job",
            icon: Target,
            title: "Job Matcher",
            description: "So khớp kỹ năng với yêu cầu công việc",
            color: "green",
            href: "/jobs",
        },
    ];

    const iconColors: Record<string, string> = {
        green: "stat-icon green",
        orange: "stat-icon orange",
        blue: "stat-icon blue",
        purple: "stat-icon purple",
    };

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <h1 className="text-2xl font-bold font-heading text-gray-900">Tổng Quan</h1>

            {/* Hero Welcome Banner */}
            <div className="gradient-hero rounded-2xl p-6 text-white">
                <h2 className="text-2xl font-bold font-heading mb-2">
                    Xin chào, {userName}! 👋
                </h2>
                <p className="text-white/90 mb-4">
                    Gói hiện tại: <span className="font-bold bg-white/20 px-2 py-0.5 rounded">{plan}</span>
                </p>
                <div className="flex gap-3">
                    <Link
                        href="/settings?tab=billing"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 font-medium rounded-full hover:bg-orange-50 transition"
                    >
                        <TrendingUp className="w-4 h-4" />
                        Nâng Cấp Pro
                    </Link>
                    <Link
                        href="/posts/new"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white font-medium rounded-full hover:bg-white/30 transition backdrop-blur"
                    >
                        <Zap className="w-4 h-4" />
                        Bắt Đầu Ngay
                    </Link>
                </div>
            </div>

            {/* AI Usage Stats */}
            <div>
                <h2 className="text-lg font-bold font-heading text-gray-900 mb-4">Sử Dụng AI Hôm Nay</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="card">
                            <div className={iconColors[stat.color]}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-gray-500 mt-4">{stat.label}</p>
                            <p className="text-2xl font-bold font-heading text-gray-900">{stat.value}</p>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                                <div
                                    className={`h-full transition-all ${stat.color === "green" ? "bg-green-500" :
                                            stat.color === "orange" ? "bg-orange-500" :
                                                stat.color === "blue" ? "bg-blue-500" :
                                                    "bg-purple-500"
                                        }`}
                                    style={{ width: `${Math.min(stat.progress, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-bold font-heading text-gray-900 mb-4">Bắt Đầu Nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {features.map((feature) => {
                        const IconComponent = feature.icon;
                        return (
                            <Link
                                key={feature.id}
                                href={feature.href}
                                className="card group hover:shadow-card-hover transition-all hover:-translate-y-1"
                            >
                                <div className={iconColors[feature.color]}>
                                    <IconComponent className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 mt-4 mb-1">{feature.title}</h3>
                                <p className="text-sm text-gray-500">{feature.description}</p>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Chrome Extension CTA */}
            <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Cài Đặt Chrome Extension</h3>
                        <p className="text-sm text-gray-500">
                            Nhận gợi ý AI trực tiếp trên LinkedIn với extension trình duyệt
                        </p>
                    </div>
                    <a
                        href="#"
                        className="btn btn-primary whitespace-nowrap"
                    >
                        Cài Extension
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}
