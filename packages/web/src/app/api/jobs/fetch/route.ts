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

        const { jobUrl } = await req.json();

        if (!jobUrl || !jobUrl.includes("linkedin.com/jobs/")) {
            return NextResponse.json(
                { success: false, error: { message: "Invalid LinkedIn job URL" } },
                { status: 400 }
            );
        }

        // Fetch the job page HTML
        const response = await fetch(jobUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: { message: "Failed to fetch job page" } },
                { status: 500 }
            );
        }

        const html = await response.text();

        // Extract job data from HTML
        const jobData = extractJobDataFromHtml(html, jobUrl);

        return NextResponse.json({
            success: true,
            data: jobData,
        });
    } catch (error) {
        console.error("Job fetch error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to fetch job data" } },
            { status: 500 }
        );
    }
}

function extractJobDataFromHtml(html: string, jobUrl: string) {
    // Extract title from various possible locations
    let title = "";
    const titleMatch = html.match(/<h1[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
        html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
        html.match(/<title>([^|<]+)/i);
    if (titleMatch) {
        title = titleMatch[1].trim().replace(/\s+/g, " ");
    }

    // Extract company name
    let company = "";
    const companyMatch = html.match(/<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>([^<]+)<\/a>/i) ||
        html.match(/<span[^>]*class="[^"]*top-card-layout__company-name[^"]*"[^>]*>([^<]+)<\/span>/i) ||
        html.match(/data-tracking-control-name="public_jobs_topcard-org-name"[^>]*>([^<]+)</i);
    if (companyMatch) {
        company = companyMatch[1].trim();
    }

    // Extract location
    let location = "";
    const locationMatch = html.match(/<span[^>]*class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>([^<]+)<\/span>/i) ||
        html.match(/<span[^>]*class="[^"]*top-card-layout__second-subline[^"]*"[^>]*>[^<]*<span[^>]*>([^<]+)<\/span>/i);
    if (locationMatch) {
        location = locationMatch[1].trim();
    }

    // Extract job description - look for the description section
    let description = "";

    // Try different patterns for job description
    const descriptionPatterns = [
        /<div[^>]*class="[^"]*description__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<section[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
        /<div[^>]*data-job-posting-description[^>]*>([\s\S]*?)<\/div>/i,
    ];

    for (const pattern of descriptionPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
            description = match[1];
            break;
        }
    }

    // Clean up HTML tags from description and format as plain text
    description = description
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<li>/gi, "• ")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    // If no description found, try to extract from JSON-LD
    if (!description) {
        const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
        if (jsonLdMatch) {
            try {
                const jsonLd = JSON.parse(jsonLdMatch[1]);
                if (jsonLd.description) {
                    description = jsonLd.description;
                }
                if (!title && jsonLd.title) {
                    title = jsonLd.title;
                }
                if (!company && jsonLd.hiringOrganization?.name) {
                    company = jsonLd.hiringOrganization.name;
                }
                if (!location && jsonLd.jobLocation?.address) {
                    const addr = jsonLd.jobLocation.address;
                    location = [addr.addressLocality, addr.addressRegion, addr.addressCountry]
                        .filter(Boolean)
                        .join(", ");
                }
            } catch (e) {
                // JSON parse failed, continue
            }
        }
    }

    return {
        title: title || "Unknown Position",
        company: company || "Unknown Company",
        location: location || "",
        description: description || "Could not extract job description. Please paste manually.",
        jobUrl,
    };
}
