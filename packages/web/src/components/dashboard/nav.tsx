"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    Sparkles,
    LayoutDashboard,
    PenTool,
    User,
    Briefcase,
    Settings,
    LogOut,
    Crown,
    HelpCircle,
    Bell,
    Shield,
} from "lucide-react";
import { isSuperAdmin } from "@/lib/admin";

interface DashboardNavProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

const mainNavItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Tổng Quan" },
    { href: "/posts", icon: PenTool, label: "Viết Bài" },
    { href: "/profile", icon: User, label: "Tối Ưu Profile" },
    { href: "/jobs", icon: Briefcase, label: "Job Matcher" },
    { href: "/settings", icon: Settings, label: "Cài Đặt" },
];

const supportNavItems = [
    { href: "/notifications", icon: Bell, label: "Thông Báo" },
    { href: "/support", icon: HelpCircle, label: "Hỗ Trợ" },
];

export function DashboardNav({ user }: DashboardNavProps) {
    const pathname = usePathname();
    const isAdmin = isSuperAdmin(user.email);

    return (
        <nav className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold font-heading text-gray-900">LinkedBoost</span>
                </Link>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {mainNavItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${isActive ? "active" : ""}`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

                {/* Support Section */}
                <div className="pt-6 mt-6 border-t border-gray-100">
                    <p className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Hỗ Trợ
                    </p>
                    {supportNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`nav-item ${isActive ? "active" : ""}`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Admin Section - Only for SuperAdmin */}
                {isAdmin && (
                    <div className="pt-6 mt-6 border-t border-gray-100">
                        <p className="px-3 mb-2 text-xs font-medium text-red-400 uppercase tracking-wider">
                            Admin
                        </p>
                        <Link
                            href="/admin"
                            className={`nav-item ${pathname === "/admin" ? "active text-red-600" : "text-red-500 hover:bg-red-50"}`}
                        >
                            <Shield className="w-5 h-5" />
                            <span>Quản Trị</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Upgrade banner */}
            <div className="mx-3 mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold text-sm text-gray-900">Nâng Cấp Pro</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                    Mở khóa tất cả tính năng AI không giới hạn
                </p>
                <Link
                    href="/settings?tab=billing"
                    className="block w-full py-2 text-center text-sm font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                >
                    Xem Các Gói
                </Link>
            </div>

            {/* User section */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                    {user.image ? (
                        <img
                            src={user.image}
                            alt={user.name || "User"}
                            className="w-10 h-10 rounded-full"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                            <span className="text-white font-bold">
                                {user.name?.charAt(0) || "U"}
                            </span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{user.name || "User"}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                    <LogOut className="w-4 h-4" />
                    Đăng Xuất
                </button>
            </div>
        </nav>
    );
}
