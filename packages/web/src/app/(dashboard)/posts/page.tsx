import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PenTool, Plus, Clock, Copy, Info, FileText } from "lucide-react";

export default async function PostsPage() {
    const session = await auth();

    const posts = await prisma.postDraft.findMany({
        where: { userId: session!.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <h1 className="text-2xl font-bold font-heading text-gray-900">Post Writer</h1>

            {/* Hero Title - Caffiliate Style */}
            <div className="text-center py-8">
                <h2 className="text-3xl font-bold font-heading">
                    Công Cụ <span className="text-green-500">Tạo Bài Viết</span>
                </h2>
                <p className="text-gray-500 mt-2">
                    Tạo bài viết LinkedIn chuyên nghiệp với AI
                </p>
            </div>

            {/* Info Banner - Yellow warning style */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Info className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-amber-800 mb-1">LƯU Ý QUAN TRỌNG:</h4>
                        <ul className="text-sm text-amber-700 space-y-1">
                            <li>• Mỗi bài viết được <strong>tối ưu cho thuật toán LinkedIn</strong></li>
                            <li>• Bạn có thể <strong>chỉnh sửa</strong> nội dung trước khi đăng</li>
                            <li>• Sử dụng <strong>hashtag phù hợp</strong> để tăng tương tác</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
                <Link href="/posts/new" className="btn btn-primary text-base px-8 py-3">
                    <Plus className="w-5 h-5" />
                    Tạo Bài Viết Mới
                </Link>
            </div>

            {/* Posts List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold font-heading text-gray-900">Danh Sách Bài Viết</h3>
                    <span className="text-sm text-gray-500">Quản lý các bài viết của bạn</span>
                </div>

                {posts.length > 0 ? (
                    <div className="card overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="col-span-1">ID</div>
                            <div className="col-span-5">NỘI DUNG</div>
                            <div className="col-span-2">NGÀY TẠO</div>
                            <div className="col-span-2">LOẠI</div>
                            <div className="col-span-2">TRẠNG THÁI</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-100">
                            {posts.map((post, index) => (
                                <div key={post.id} className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-50 transition-colors">
                                    <div className="col-span-1 text-sm text-gray-500">
                                        #{String(index + 1).padStart(2, '0')}
                                    </div>
                                    <div className="col-span-5">
                                        <p className="text-sm text-gray-900 line-clamp-2">{post.content}</p>
                                        <div className="flex gap-1 mt-1">
                                            {post.hashtags.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="text-xs text-green-500">#{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-sm text-gray-500">
                                        {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                                    </div>
                                    <div className="col-span-2 text-sm text-gray-500 capitalize">
                                        {post.tone} • {post.format}
                                    </div>
                                    <div className="col-span-2">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${post.status === "PUBLISHED"
                                                ? "bg-green-100 text-green-700"
                                                : post.status === "ARCHIVED"
                                                    ? "bg-gray-100 text-gray-600"
                                                    : "bg-amber-100 text-amber-700"
                                            }`}>
                                            {post.status === "DRAFT" ? "Nháp" :
                                                post.status === "PUBLISHED" ? "Đã đăng" : "Lưu trữ"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="card text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có bài viết nào</h3>
                        <p className="text-gray-500 mb-6">
                            Tạo bài viết LinkedIn đầu tiên của bạn với AI
                        </p>
                        <Link href="/posts/new" className="btn btn-primary inline-flex">
                            <Plus className="w-5 h-5" />
                            Tạo Bài Viết
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
