"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Check, Loader2 } from "lucide-react";

export default function DashboardExtensionCallback() {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const isExtension = searchParams.get("extension") === "true";
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "authenticated" && session?.user && isExtension && !sent) {
            // Send auth data to extension
            sendAuthToExtension();
        }
    }, [status, session, isExtension, sent]);

    const sendAuthToExtension = () => {
        try {
            // Extension ID - would be your actual extension ID in production
            const extensionId = chrome?.runtime?.id;

            if (typeof chrome !== "undefined" && chrome.runtime) {
                // Store user data that extension can access
                const userData = {
                    name: session?.user?.name,
                    email: session?.user?.email,
                    image: session?.user?.image,
                    plan: "FREE", // Default, would come from DB
                };

                // Try to send message to extension directly
                try {
                    chrome.runtime.sendMessage(
                        extensionId || "",
                        {
                            type: "AUTH_SUCCESS",
                            user: userData,
                            token: "session-token", // In production, use actual token
                        },
                        (response) => {
                            if (response?.success) {
                                setSent(true);
                            }
                        }
                    );
                } catch {
                    // Extension messaging not available
                }

                // Also try postMessage for cross-origin communication
                window.postMessage({
                    type: "LINKEDBOOST_AUTH_SUCCESS",
                    user: userData,
                }, "*");

                setSent(true);

                // Redirect to dashboard after short delay
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 2000);
            } else {
                // No chrome API, redirect anyway
                window.location.href = "/dashboard";
            }
        } catch (err) {
            console.error("Failed to send auth to extension:", err);
            setError("Không thể kết nối với extension");
            // Redirect anyway
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 2000);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Đang xác thực...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="card max-w-md w-full text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    {sent ? (
                        <Check className="w-8 h-8 text-white" />
                    ) : (
                        <Sparkles className="w-8 h-8 text-white" />
                    )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {sent ? "Đăng Nhập Thành Công!" : "Đang Kết Nối Extension..."}
                </h1>

                <p className="text-gray-500 mb-4">
                    {sent
                        ? "Extension đã được kết nối. Bạn sẽ được chuyển đến Dashboard."
                        : "Vui lòng chờ trong giây lát..."
                    }
                </p>

                {error && (
                    <p className="text-amber-600 text-sm mb-4">{error}</p>
                )}

                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang chuyển hướng...
                </div>
            </div>
        </div>
    );
}
