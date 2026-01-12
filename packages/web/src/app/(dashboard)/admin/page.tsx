"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Shield,
    Database,
    Key,
    Globe,
    CreditCard,
    Bot,
    Save,
    Eye,
    EyeOff,
    AlertTriangle,
    Check,
    Settings as SettingsIcon,
    Users,
    BarChart3,
} from "lucide-react";
import { isSuperAdmin } from "@/lib/admin";

interface ConfigSection {
    id: string;
    title: string;
    icon: React.ElementType;
    fields: ConfigField[];
}

interface ConfigField {
    key: string;
    label: string;
    type: "text" | "password" | "url" | "number";
    placeholder: string;
    description?: string;
    required?: boolean;
}

const configSections: ConfigSection[] = [
    {
        id: "database",
        title: "Database",
        icon: Database,
        fields: [
            {
                key: "DATABASE_URL",
                label: "Database URL",
                type: "password",
                placeholder: "postgresql://...",
                description: "Neon PostgreSQL connection string",
                required: true,
            },
        ],
    },
    {
        id: "auth",
        title: "Authentication",
        icon: Key,
        fields: [
            {
                key: "NEXTAUTH_SECRET",
                label: "NextAuth Secret",
                type: "password",
                placeholder: "Random secret key",
                required: true,
            },
            {
                key: "NEXTAUTH_URL",
                label: "App URL",
                type: "url",
                placeholder: "http://localhost:3001",
                required: true,
            },
        ],
    },
    {
        id: "google",
        title: "Google OAuth",
        icon: Globe,
        fields: [
            {
                key: "GOOGLE_CLIENT_ID",
                label: "Client ID",
                type: "text",
                placeholder: "xxxxx.apps.googleusercontent.com",
            },
            {
                key: "GOOGLE_CLIENT_SECRET",
                label: "Client Secret",
                type: "password",
                placeholder: "GOCSPX-...",
            },
        ],
    },
    {
        id: "linkedin",
        title: "LinkedIn OAuth",
        icon: Globe,
        fields: [
            {
                key: "LINKEDIN_CLIENT_ID",
                label: "Client ID",
                type: "text",
                placeholder: "xxxxxxxxxxxx",
            },
            {
                key: "LINKEDIN_CLIENT_SECRET",
                label: "Client Secret",
                type: "password",
                placeholder: "WPL_AP1...",
            },
        ],
    },
    {
        id: "ai",
        title: "AI Provider",
        icon: Bot,
        fields: [
            {
                key: "OPENROUTER_API_KEY",
                label: "OpenRouter API Key",
                type: "password",
                placeholder: "sk-or-v1-...",
                description: "API key for AI models (Llama, Gemma, Mistral)",
                required: true,
            },
        ],
    },
    {
        id: "stripe",
        title: "Stripe Payments",
        icon: CreditCard,
        fields: [
            {
                key: "STRIPE_SECRET_KEY",
                label: "Secret Key",
                type: "password",
                placeholder: "sk_live_...",
            },
            {
                key: "STRIPE_PUBLISHABLE_KEY",
                label: "Publishable Key",
                type: "text",
                placeholder: "pk_live_...",
            },
            {
                key: "STRIPE_WEBHOOK_SECRET",
                label: "Webhook Secret",
                type: "password",
                placeholder: "whsec_...",
            },
        ],
    },
];

// Plan limits configuration
const planLimits = {
    FREE: {
        REPLY_SUGGEST: 5,
        POST_GENERATE: 3,
        PROFILE_ANALYZE: 1,
        JOB_MATCH: 3,
    },
    PRO: {
        REPLY_SUGGEST: -1, // unlimited
        POST_GENERATE: 20,
        PROFILE_ANALYZE: -1,
        JOB_MATCH: 20,
    },
    PREMIUM: {
        REPLY_SUGGEST: -1,
        POST_GENERATE: -1,
        PROFILE_ANALYZE: -1,
        JOB_MATCH: -1,
    },
};

export default function AdminPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState("config");
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
    const [configValues, setConfigValues] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const isAdmin = isSuperAdmin(session?.user?.email);

    useEffect(() => {
        // Load saved config from localStorage (in production, use secure backend)
        const savedConfig = localStorage.getItem("linkedboost_admin_config");
        if (savedConfig) {
            setConfigValues(JSON.parse(savedConfig));
        }
    }, []);

    const togglePassword = (key: string) => {
        setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        // In production, save to secure backend
        localStorage.setItem("linkedboost_admin_config", JSON.stringify(configValues));
        await new Promise((r) => setTimeout(r, 500));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <Shield className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Truy Cập Bị Từ Chối</h2>
                    <p className="text-gray-500">
                        Bạn cần quyền SuperAdmin để truy cập trang này.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                        Email hiện tại: {session?.user?.email}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold font-heading text-gray-900 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-red-500" />
                    Quản Trị Hệ Thống
                </h1>
                <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-medium rounded-full">
                    SuperAdmin
                </span>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700">
                        <strong>Cảnh báo:</strong> Thay đổi các cài đặt này có thể ảnh hưởng đến toàn bộ hệ thống.
                        Hãy cẩn thận và backup trước khi thay đổi.
                    </div>
                </div>
            </div>

            {/* Admin Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
                {[
                    { id: "config", label: "Cấu Hình", icon: SettingsIcon },
                    { id: "users", label: "Người Dùng", icon: Users },
                    { id: "analytics", label: "Analytics", icon: BarChart3 },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium ${activeTab === tab.id
                                ? "bg-red-50 text-red-600"
                                : "text-gray-500 hover:bg-gray-50"
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Config Tab */}
            {activeTab === "config" && (
                <div className="space-y-6">
                    {configSections.map((section) => (
                        <div key={section.id} className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <section.icon className="w-5 h-5 text-gray-400" />
                                {section.title}
                            </h3>
                            <div className="space-y-4">
                                {section.fields.map((field) => (
                                    <div key={field.key}>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {field.label}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={
                                                    field.type === "password" && !showPasswords[field.key]
                                                        ? "password"
                                                        : "text"
                                                }
                                                value={configValues[field.key] || ""}
                                                onChange={(e) =>
                                                    setConfigValues((prev) => ({
                                                        ...prev,
                                                        [field.key]: e.target.value,
                                                    }))
                                                }
                                                placeholder={field.placeholder}
                                                className="input pr-10"
                                            />
                                            {field.type === "password" && (
                                                <button
                                                    type="button"
                                                    onClick={() => togglePassword(field.key)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPasswords[field.key] ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Eye className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                        {field.description && (
                                            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Plan Limits Config */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-gray-400" />
                            Giới Hạn Theo Gói
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium text-gray-500">Feature</th>
                                        <th className="text-center py-2 font-medium text-gray-500">FREE</th>
                                        <th className="text-center py-2 font-medium text-gray-500">PRO</th>
                                        <th className="text-center py-2 font-medium text-gray-500">PREMIUM</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(planLimits.FREE).map((feature) => (
                                        <tr key={feature} className="border-b border-gray-100">
                                            <td className="py-2 text-gray-700">{feature.replace("_", " ")}</td>
                                            <td className="py-2 text-center">
                                                <input
                                                    type="number"
                                                    defaultValue={planLimits.FREE[feature as keyof typeof planLimits.FREE]}
                                                    className="w-16 text-center border border-gray-200 rounded px-2 py-1"
                                                />
                                            </td>
                                            <td className="py-2 text-center">
                                                <input
                                                    type="number"
                                                    defaultValue={planLimits.PRO[feature as keyof typeof planLimits.PRO]}
                                                    className="w-16 text-center border border-gray-200 rounded px-2 py-1"
                                                />
                                            </td>
                                            <td className="py-2 text-center">
                                                <input
                                                    type="number"
                                                    defaultValue={planLimits.PREMIUM[feature as keyof typeof planLimits.PREMIUM]}
                                                    className="w-16 text-center border border-gray-200 rounded px-2 py-1"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="text-xs text-gray-500 mt-2">-1 = Không giới hạn</p>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary"
                        >
                            {saving ? (
                                <>Đang lưu...</>
                            ) : saved ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Đã Lưu
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Lưu Cấu Hình
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
                <div className="card text-center py-16">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Quản Lý Người Dùng</h3>
                    <p className="text-gray-500">
                        Tính năng đang phát triển. Sẽ cho phép xem và quản lý người dùng.
                    </p>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
                <div className="card text-center py-16">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics</h3>
                    <p className="text-gray-500">
                        Tính năng đang phát triển. Sẽ hiển thị thống kê sử dụng hệ thống.
                    </p>
                </div>
            )}
        </div>
    );
}
