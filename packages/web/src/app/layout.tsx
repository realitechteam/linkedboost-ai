import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
    title: "LinkedBoost AI - Your AI-Powered LinkedIn Assistant",
    description: "Boost your LinkedIn presence with AI-powered reply suggestions, post writing, profile optimization, and job matching.",
    keywords: ["LinkedIn", "AI", "Career", "Professional", "Networking", "Job Search"],
    authors: [{ name: "LinkedBoost AI" }],
    openGraph: {
        title: "LinkedBoost AI - Your AI-Powered LinkedIn Assistant",
        description: "Boost your LinkedIn presence with AI-powered tools",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
