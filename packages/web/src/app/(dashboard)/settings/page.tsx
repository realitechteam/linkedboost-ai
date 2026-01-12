"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
    Settings as SettingsIcon,
    User,
    CreditCard,
    Bell,
    Shield,
    LogOut,
    Crown,
    Check,
    ExternalLink,
    Info,
} from "lucide-react";

const tabs = [
    { id: "account", label: "Tài Khoản", icon: User },
    { id: "billing", label: "Thanh Toán", icon: CreditCard },
    { id: "notifications", label: "Thông Báo", icon: Bell },
];

const plans = [
    {
        id: "FREE",
        name: "Miễn Phí",
        price: "$0",
        period: "mãi mãi",
        features: [
            "5 AI replies mỗi ngày",
            "3 bài viết mỗi tháng",
            "1 lần phân tích profile/tháng",
            "3 job matches mỗi tháng",
        ],
    },
    {
        id: "PRO",
        name: "Pro",
        price: "$9.99",
        period: "mỗi tháng",
        features: [
            "Không giới hạn AI replies",
            "20 bài viết mỗi tháng",
            "Không giới hạn profile reviews",
            "20 job matches mỗi tháng",
            "Hỗ trợ ưu tiên",
        ],
        popular: true,
    },
    {
        id: "PREMIUM",
        name: "Premium",
        price: "$19.99",
        period: "mỗi tháng",
        features: [
            "Tất cả tính năng Pro",
            "Không giới hạn bài viết",
            "Không giới hạn job matches",
            "Analytics nâng cao",
            "API access",
            "Tính năng team",
        ],
    },
];

export default function SettingsPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState("account");
    const [currentPlan] = useState("FREE");

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <h1 className="text-2xl font-bold font-heading text-gray-900">Cài Đặt</h1>

            {/* Tabs - Caffiliate Style */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium ${activeTab === tab.id
                            ? "bg-green-50 text-green-600"
                            : "text-gray-500 hover:bg-gray-50"
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Account Tab */}
            {activeTab === "account" && (
                <div className="space-y-6">
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông Tin Tài Khoản</h3>
                        <div className="flex items-center gap-4 mb-6">
                            {session?.user?.image ? (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name || ""}
                                    className="w-20 h-20 rounded-full"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-white">
                                        {session?.user?.name?.charAt(0) || "U"}
                                    </span>
                                </div>
                            )}
                            <div>
                                <h4 className="text-xl font-semibold text-gray-900">{session?.user?.name}</h4>
                                <p className="text-gray-500">{session?.user?.email}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tên</label>
                                <input
                                    type="text"
                                    defaultValue={session?.user?.name || ""}
                                    className="input"
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    defaultValue={session?.user?.email || ""}
                                    className="input"
                                    disabled
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card border-red-200 bg-red-50/50">
                        <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Vùng Nguy Hiểm
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Sau khi xóa tài khoản, bạn không thể khôi phục lại. Hãy cẩn thận.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="btn btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4" />
                                Đăng Xuất
                            </button>
                            <button className="btn btn-secondary text-red-600 border-red-200 hover:bg-red-50">
                                Xóa Tài Khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
                <div className="space-y-6">
                    {/* Current Plan Card - Caffiliate Blue Style */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-blue-100 text-sm">Gói Hiện Tại</p>
                                <h3 className="text-2xl font-bold">{currentPlan === "FREE" ? "0 đ" : currentPlan === "PRO" ? "$9.99" : "$19.99"}</h3>
                            </div>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                                {currentPlan}
                            </span>
                        </div>
                        <p className="text-blue-100 text-sm">
                            {currentPlan === "FREE"
                                ? "Nâng cấp để mở khóa thêm tính năng AI và giới hạn cao hơn."
                                : "Cảm ơn bạn đã hỗ trợ chúng tôi!"}
                        </p>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid md:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`card relative ${plan.popular ? "border-green-400 ring-1 ring-green-200" : ""
                                    } ${currentPlan === plan.id ? "bg-green-50/50" : ""}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                                        Phổ Biến
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mb-2">
                                    {(plan.id === "PRO" || plan.id === "PREMIUM") && (
                                        <Crown className="w-5 h-5 text-orange-500" />
                                    )}
                                    <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                                </div>

                                <div className="mb-4">
                                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                                    <span className="text-gray-500 text-sm">/{plan.period}</span>
                                </div>

                                <ul className="space-y-2 mb-6">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                            <Check className="w-4 h-4 text-green-500" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className={`btn w-full ${currentPlan === plan.id
                                        ? "btn-secondary cursor-default"
                                        : plan.popular
                                            ? "btn-primary"
                                            : "btn-secondary"
                                        }`}
                                    disabled={currentPlan === plan.id}
                                >
                                    {currentPlan === plan.id ? "Gói Hiện Tại" : "Nâng Cấp"}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Contact CTA */}
                    <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Cần tư vấn?</h3>
                                <p className="text-sm text-gray-500">
                                    Liên hệ để được tư vấn hoặc báo giá cho team.
                                </p>
                            </div>
                            <a href="mailto:support@linkedboost.ai" className="btn btn-secondary">
                                Liên Hệ Sales
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
                <div className="space-y-4">
                    {/* Info Banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-700">
                                <strong>Thông tin:</strong> Quản lý các thông báo email và trong ứng dụng tại đây.
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài Đặt Thông Báo</h3>
                        <div className="space-y-4">
                            {[
                                { id: "email", label: "Thông báo email", description: "Nhận cập nhật về tài khoản" },
                                { id: "usage", label: "Cảnh báo sử dụng", description: "Thông báo khi gần đạt giới hạn" },
                                { id: "tips", label: "Mẹo & hướng dẫn", description: "Tìm hiểu cách sử dụng LinkedBoost" },
                                { id: "product", label: "Cập nhật sản phẩm", description: "Tính năng mới và cải tiến" },
                            ].map((item) => (
                                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.label}</p>
                                        <p className="text-sm text-gray-500">{item.description}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
