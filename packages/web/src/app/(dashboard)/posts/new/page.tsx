"use client";

import { useState } from "react";
import {
    PenTool,
    Sparkles,
    Copy,
    Check,
    Loader2,
    RefreshCw,
    Hash,
    Wand2,
    Info
} from "lucide-react";

type PostTone = "professional" | "casual" | "inspirational" | "educational";
type PostFormat = "story" | "tips" | "announcement" | "question" | "carousel";

const toneOptions: { value: PostTone; label: string; emoji: string }[] = [
    { value: "professional", label: "Chuyên nghiệp", emoji: "💼" },
    { value: "casual", label: "Thân thiện", emoji: "😊" },
    { value: "inspirational", label: "Truyền cảm hứng", emoji: "✨" },
    { value: "educational", label: "Giáo dục", emoji: "📚" },
];

const formatOptions: { value: PostFormat; label: string; description: string }[] = [
    { value: "story", label: "Câu chuyện", description: "Chia sẻ trải nghiệm cá nhân" },
    { value: "tips", label: "Mẹo & Tips", description: "Liệt kê các bước thực hiện" },
    { value: "announcement", label: "Thông báo", description: "Chia sẻ tin tức mới" },
    { value: "question", label: "Câu hỏi", description: "Tạo thảo luận" },
    { value: "carousel", label: "Carousel", description: "Nội dung nhiều slide" },
];

interface GeneratedPost {
    content: string;
    hashtags: string[];
}

export default function PostWriterPage() {
    const [topic, setTopic] = useState("");
    const [tone, setTone] = useState<PostTone>("professional");
    const [format, setFormat] = useState<PostFormat>("story");
    const [keywords, setKeywords] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [posts, setPosts] = useState<GeneratedPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<number>(0);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/ai/post-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: topic.trim(),
                    tone,
                    format,
                    keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || "Failed to generate posts");
            }

            setPosts(data.data.posts);
            setSelectedPost(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!posts[selectedPost]) return;

        const post = posts[selectedPost];
        const text = `${post.content}\n\n${post.hashtags.map(h => `#${h}`).join(" ")}`;

        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <h1 className="text-2xl font-bold font-heading text-gray-900">Tạo Bài Viết</h1>

            {/* Hero Title - Caffiliate Style */}
            <div className="text-center py-6">
                <h2 className="text-3xl font-bold font-heading">
                    Công Cụ <span className="text-green-500">Viết Bài</span>
                </h2>
                <p className="text-gray-500 mt-2">
                    Tạo bài viết LinkedIn thu hút với AI
                </p>
            </div>

            {/* Info Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700">
                        <strong>Mẹo:</strong> Mô tả chi tiết chủ đề để AI tạo nội dung chất lượng cao hơn.
                        Bạn có thể chỉnh sửa nội dung trước khi copy.
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-4">
                    {/* Topic */}
                    <div className="card">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bạn muốn viết về chủ đề gì?
                        </label>
                        <textarea
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Ví dụ: Hành trình từ developer đến tech lead, những bài học và thử thách..."
                            className="input min-h-[120px] resize-none"
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-400 mt-2 text-right">
                            {topic.length}/500
                        </p>
                    </div>

                    {/* Tone Selection */}
                    <div className="card">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Giọng điệu</label>
                        <div className="grid grid-cols-2 gap-2">
                            {toneOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setTone(option.value)}
                                    className={`p-3 rounded-xl border transition-all text-left ${tone === option.value
                                        ? "border-green-500 bg-green-50 text-green-700"
                                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                                        }`}
                                >
                                    <span className="text-lg mr-2">{option.emoji}</span>
                                    <span className="font-medium">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div className="card">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Định dạng</label>
                        <div className="space-y-2">
                            {formatOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setFormat(option.value)}
                                    className={`w-full p-3 rounded-xl border transition-all text-left ${format === option.value
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <span className={`font-medium ${format === option.value ? "text-green-700" : "text-gray-900"}`}>
                                        {option.label}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-2">
                                        — {option.description}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Keywords */}
                    <div className="card">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Từ khóa (tuỳ chọn)
                        </label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                placeholder="leadership, tech, startup (phân cách bằng dấu phẩy)"
                                className="input pl-10"
                            />
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={!topic.trim() || isLoading}
                        className="btn btn-primary w-full py-4 text-lg"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Đang tạo...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                Tạo Bài Viết
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Preview Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Xem trước</h2>
                        {posts.length > 1 && (
                            <div className="flex gap-2">
                                {posts.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedPost(i)}
                                        className={`w-8 h-8 rounded-lg font-medium transition ${selectedPost === i
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card min-h-[500px] flex flex-col">
                        {posts.length > 0 ? (
                            <>
                                {/* LinkedIn Post Preview */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500" />
                                        <div>
                                            <p className="font-semibold text-gray-900">Tên của bạn</p>
                                            <p className="text-xs text-gray-500">Tiêu đề của bạn • Bây giờ</p>
                                        </div>
                                    </div>

                                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-6">
                                        {posts[selectedPost]?.content}
                                    </div>

                                    {posts[selectedPost]?.hashtags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {posts[selectedPost].hashtags.map((tag, i) => (
                                                <span key={i} className="text-green-500 text-sm">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={handleCopy}
                                        className="btn btn-primary flex-1"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Đã copy!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy Bài Viết
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isLoading}
                                        className="btn btn-secondary"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                                        Tạo lại
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
                                <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                                <p className="font-medium text-gray-600 mb-1">Chưa có bài viết nào</p>
                                <p className="text-sm">
                                    Nhập chủ đề và nhấn Tạo Bài Viết để bắt đầu
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
