"use client";

import { useState } from "react";
import {
    Bell,
    Check,
    Trash2,
    CheckCheck,
    Info,
    AlertCircle,
    Sparkles,
    Clock,
} from "lucide-react";

interface Notification {
    id: string;
    type: "info" | "success" | "warning" | "feature";
    title: string;
    message: string;
    time: string;
    read: boolean;
}

const mockNotifications: Notification[] = [
    {
        id: "1",
        type: "success",
        title: "Profile Đã Đồng Bộ",
        message: "Profile LinkedIn của bạn đã được đồng bộ thành công từ extension.",
        time: "5 phút trước",
        read: false,
    },
    {
        id: "2",
        type: "feature",
        title: "Tính Năng Mới: Job Matcher",
        message: "Giờ bạn có thể paste link job từ LinkedIn để tự động lấy thông tin!",
        time: "1 giờ trước",
        read: false,
    },
    {
        id: "3",
        type: "info",
        title: "Chào Mừng Đến LinkedBoost AI",
        message: "Cài đặt Chrome Extension để sử dụng đầy đủ các tính năng AI trên LinkedIn.",
        time: "1 ngày trước",
        read: true,
    },
    {
        id: "4",
        type: "warning",
        title: "Sắp Hết Hạn Mức",
        message: "Bạn đã sử dụng 4/5 AI replies hôm nay. Nâng cấp để không giới hạn!",
        time: "2 ngày trước",
        read: true,
    },
];

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const getIcon = (type: Notification["type"]) => {
        switch (type) {
            case "success":
                return <Check className="w-5 h-5" />;
            case "warning":
                return <AlertCircle className="w-5 h-5" />;
            case "feature":
                return <Sparkles className="w-5 h-5" />;
            default:
                return <Info className="w-5 h-5" />;
        }
    };

    const getColor = (type: Notification["type"]) => {
        switch (type) {
            case "success":
                return "bg-green-100 text-green-600";
            case "warning":
                return "bg-amber-100 text-amber-600";
            case "feature":
                return "bg-purple-100 text-purple-600";
            default:
                return "bg-blue-100 text-blue-600";
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <h1 className="text-2xl font-bold font-heading text-gray-900">Thông Báo</h1>

            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <p className="text-gray-500">
                    {unreadCount > 0
                        ? `Bạn có ${unreadCount} thông báo chưa đọc`
                        : "Không có thông báo mới"}
                </p>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="btn btn-secondary text-sm"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            {/* Notifications List */}
            {notifications.length > 0 ? (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`card flex items-start gap-4 transition-all ${!notification.read ? "border-green-200 bg-green-50/30" : ""
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getColor(notification.type)}`}>
                                {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className={`font-semibold ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                                            {notification.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {notification.time}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {!notification.read && (
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition"
                                                title="Đánh dấu đã đọc"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notification.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                            title="Xóa"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Bell className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Không có thông báo</h3>
                    <p className="text-gray-500">
                        Các thông báo mới sẽ hiển thị tại đây
                    </p>
                </div>
            )}
        </div>
    );
}
