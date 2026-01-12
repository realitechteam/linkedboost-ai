"use client";

import { useState } from "react";
import {
    HelpCircle,
    MessageCircle,
    Book,
    Mail,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Youtube,
    FileText,
    Zap,
} from "lucide-react";

interface FAQ {
    question: string;
    answer: string;
}

const faqs: FAQ[] = [
    {
        question: "Làm sao để cài đặt Chrome Extension?",
        answer: "Tải extension từ trang Dashboard, sau đó mở Chrome > Settings > Extensions > Enable Developer Mode > Load unpacked và chọn folder extension đã giải nén.",
    },
    {
        question: "Extension không hiển thị trên LinkedIn?",
        answer: "Đảm bảo bạn đã đăng nhập vào LinkedBoost AI trên web app, sau đó refresh trang LinkedIn. Extension sẽ tự động kích hoạt khi phát hiện trang LinkedIn.",
    },
    {
        question: "Làm sao để tự động đồng bộ profile?",
        answer: "Sau khi cài extension và đăng nhập, chỉ cần truy cập trang profile LinkedIn của bạn. Extension sẽ tự động phát hiện và đồng bộ dữ liệu.",
    },
    {
        question: "Tại sao Job Matcher cho điểm thấp?",
        answer: "Điểm phù hợp thấp có nghĩa là profile của bạn chưa có đủ kỹ năng/kinh nghiệm mà job yêu cầu. Xem tab 'Thiếu Sót' và 'Gợi Ý' để biết cần cải thiện gì.",
    },
    {
        question: "Gói Free có giới hạn gì?",
        answer: "Gói Free cho phép 5 AI replies/ngày, 3 bài viết/tháng, 1 profile review/tháng, và 3 job matches/tháng. Nâng cấp Pro để không giới hạn.",
    },
    {
        question: "Làm sao để nâng cấp lên Pro?",
        answer: "Vào Settings > Thanh Toán > Chọn gói Pro hoặc Premium > Thanh toán qua Stripe. Sau khi thanh toán thành công, các tính năng Pro sẽ được mở khóa ngay.",
    },
];

export default function SupportPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <h1 className="text-2xl font-bold font-heading text-gray-900">Hỗ Trợ</h1>

            {/* Hero */}
            <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold font-heading text-gray-900 mb-2">Bạn Cần Giúp Đỡ?</h2>
                <p className="text-gray-500">
                    Tìm câu trả lời cho các câu hỏi thường gặp hoặc liên hệ với chúng tôi
                </p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                    href="mailto:support@linkedboost.ai"
                    className="card flex items-center gap-4 hover:shadow-card-hover transition-all hover:-translate-y-1"
                >
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Email Hỗ Trợ</h3>
                        <p className="text-sm text-gray-500">support@linkedboost.ai</p>
                    </div>
                </a>

                <a
                    href="#"
                    className="card flex items-center gap-4 hover:shadow-card-hover transition-all hover:-translate-y-1"
                >
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Live Chat</h3>
                        <p className="text-sm text-gray-500">Trả lời trong 5 phút</p>
                    </div>
                </a>

                <a
                    href="#"
                    target="_blank"
                    className="card flex items-center gap-4 hover:shadow-card-hover transition-all hover:-translate-y-1"
                >
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <Youtube className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Video Hướng Dẫn</h3>
                        <p className="text-sm text-gray-500">Xem trên YouTube</p>
                    </div>
                </a>
            </div>

            {/* FAQ Section */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Book className="w-5 h-5 text-green-500" />
                    Câu Hỏi Thường Gặp
                </h3>
                <div className="divide-y divide-gray-100">
                    {faqs.map((faq, index) => (
                        <div key={index} className="py-4">
                            <button
                                onClick={() => toggleFaq(index)}
                                className="w-full flex items-center justify-between text-left"
                            >
                                <span className={`font-medium ${openFaq === index ? "text-green-600" : "text-gray-900"}`}>
                                    {faq.question}
                                </span>
                                {openFaq === index ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </button>
                            {openFaq === index && (
                                <p className="mt-3 text-gray-500 text-sm leading-relaxed">
                                    {faq.answer}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        Tài Liệu
                    </h3>
                    <ul className="space-y-2">
                        <li>
                            <a href="#" className="text-sm text-gray-600 hover:text-green-600 flex items-center gap-2">
                                <ExternalLink className="w-3 h-3" />
                                Hướng dẫn bắt đầu
                            </a>
                        </li>
                        <li>
                            <a href="#" className="text-sm text-gray-600 hover:text-green-600 flex items-center gap-2">
                                <ExternalLink className="w-3 h-3" />
                                Cài đặt Chrome Extension
                            </a>
                        </li>
                        <li>
                            <a href="#" className="text-sm text-gray-600 hover:text-green-600 flex items-center gap-2">
                                <ExternalLink className="w-3 h-3" />
                                Tối ưu hóa Profile LinkedIn
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-orange-500" />
                        Nâng Cấp Pro
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Mở khóa tất cả tính năng AI không giới hạn và nhận hỗ trợ ưu tiên.
                    </p>
                    <a href="/settings?tab=billing" className="btn btn-primary text-sm">
                        Xem Các Gói
                    </a>
                </div>
            </div>
        </div>
    );
}
