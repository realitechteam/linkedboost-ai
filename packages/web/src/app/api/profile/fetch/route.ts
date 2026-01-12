import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: { message: "Unauthorized" } },
                { status: 401 }
            );
        }

        const { profileUrl } = await req.json();

        if (!profileUrl || !profileUrl.includes("linkedin.com/in/")) {
            return NextResponse.json(
                { success: false, error: { message: "Invalid LinkedIn profile URL" } },
                { status: 400 }
            );
        }

        // Fetch the profile page HTML
        const response = await fetch(profileUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: { message: "Failed to fetch profile page" } },
                { status: 500 }
            );
        }

        const html = await response.text();

        // Extract profile data from HTML
        const profileData = extractProfileDataFromHtml(html, profileUrl);

        return NextResponse.json({
            success: true,
            data: profileData,
        });
    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to fetch profile data" } },
            { status: 500 }
        );
    }
}

function extractProfileDataFromHtml(html: string, profileUrl: string) {
    // Extract name
    let name = "";
    const nameMatch = html.match(/<title>([^|<]+)/i);
    if (nameMatch) {
        name = nameMatch[1].replace(/\s*\|.*$/, "").replace(/\s*-.*$/, "").trim();
        // Remove LinkedIn suffix
        name = name.replace(/\s*LinkedIn$/, "").trim();
    }

    // Extract headline from various locations
    let headline = "";
    const headlinePatterns = [
        /<div[^>]*class="[^"]*text-body-medium[^"]*"[^>]*>([^<]+)</i,
        /<h2[^>]*class="[^"]*mt1[^"]*"[^>]*>([^<]+)</i,
        /data-anonymize="headline"[^>]*>([^<]+)</i,
    ];
    for (const pattern of headlinePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
            headline = match[1].trim();
            break;
        }
    }

    // Extract about/summary
    let about = "";
    const aboutPatterns = [
        /<section[^>]*id="about"[^>]*>[\s\S]*?<div[^>]*class="[^"]*inline-show-more-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<section[^>]*data-section="summary"[^>]*>([\s\S]*?)<\/section>/i,
    ];
    for (const pattern of aboutPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
            about = match[1]
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<[^>]+>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 500);
            break;
        }
    }

    // Try to extract from JSON-LD
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
        try {
            const jsonLd = JSON.parse(jsonLdMatch[1]);
            if (jsonLd["@type"] === "Person") {
                if (!name && jsonLd.name) name = jsonLd.name;
                if (!headline && jsonLd.jobTitle) headline = jsonLd.jobTitle;
                if (!about && jsonLd.description) about = jsonLd.description;
            }
        } catch (e) {
            // JSON parse failed
        }
    }

    // Extract skills (simplified - would need authenticated access for full data)
    const skills: string[] = [];

    return {
        name: name || "Unknown",
        headline: headline || "",
        about: about || "",
        profileUrl,
        skills,
        experience: [],
        education: [],
    };
}
