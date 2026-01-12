import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// API endpoint for extension to check user session
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({
                success: false,
                isLoggedIn: false,
            });
        }

        // Return user data for extension
        return NextResponse.json({
            success: true,
            isLoggedIn: true,
            user: {
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
                plan: "FREE", // Would come from DB in production
            },
            usage: {
                replies: { used: 2, limit: 5 },
                posts: { used: 1, limit: 3 },
                profileReviews: { used: 0, limit: 1 },
                jobMatches: { used: 1, limit: 3 },
            },
        });
    } catch (error) {
        console.error("Session check error:", error);
        return NextResponse.json({
            success: false,
            isLoggedIn: false,
            error: "Failed to check session",
        });
    }
}
