import OpenAI from "openai";

// Initialize OpenRouter client (OpenAI-compatible API)
const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3001",
        "X-Title": "LinkedBoost AI",
    },
});

// Free models on OpenRouter (Primary + Fallback)
const PRIMARY_MODEL = "mistralai/mistral-small-3.1-24b-instruct:free";
const FALLBACK_MODEL = "openrouter/optimus-alpha:free";

export type AIModel = typeof PRIMARY_MODEL | typeof FALLBACK_MODEL;

// Helper function to call AI with fallback on rate limit
async function callAIWithFallback<T>(
    systemPrompt: string,
    userPrompt: string,
    parseResponse: (content: string) => T,
    fallbackResponse: T
): Promise<T> {
    const models = [PRIMARY_MODEL, FALLBACK_MODEL];

    for (const model of models) {
        try {
            const response = await openrouter.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature: 0.2,
                max_tokens: 2000,
                top_p: 1.0,
            });

            const content = response.choices[0]?.message?.content || "";
            console.log(`[AI] Successfully used model: ${model}`);

            try {
                return parseResponse(content);
            } catch (parseError) {
                console.error(`[AI] Parse error for ${model}:`, parseError);
                // If parsing fails, try to extract JSON from content
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return parseResponse(jsonMatch[0]);
                }
                return fallbackResponse;
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[AI] Error with ${model}:`, errorMessage);

            // Check if it's a rate limit error (429) - try fallback
            if (errorMessage.includes("429") || errorMessage.includes("rate") || errorMessage.includes("limit")) {
                console.log(`[AI] Rate limited on ${model}, trying fallback...`);
                continue;
            }

            // For other errors, also try fallback
            if (model === PRIMARY_MODEL) {
                console.log(`[AI] Switching to fallback model...`);
                continue;
            }
        }
    }

    console.error("[AI] All models failed, returning fallback response");
    return fallbackResponse;
}

// Reply suggestion prompts
export async function generateReplySuggestions(
    context: string,
    senderName?: string,
    tone: "professional" | "friendly" | "concise" = "professional",
    language: "en" | "vi" = "en"
): Promise<string[]> {
    const systemPrompt = `You are a professional LinkedIn communication assistant.
Generate 3 reply suggestions for a LinkedIn message conversation.
Each suggestion should be:
1. Appropriate for LinkedIn professional networking
2. Match the ${tone} tone
3. Be in ${language === "vi" ? "Vietnamese" : "English"}
4. Be concise but complete

Return ONLY a JSON array of 3 strings, no explanation. Example:
["Reply 1", "Reply 2", "Reply 3"]`;

    const userPrompt = `Conversation context:
${context}

${senderName ? `Sender: ${senderName}` : ""}

Generate 3 ${tone} reply suggestions.`;

    return callAIWithFallback(
        systemPrompt,
        userPrompt,
        (content) => {
            const parsed = JSON.parse(content);
            return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
        },
        [
            "Thank you for reaching out. I'd be happy to discuss this further.",
            "Thanks for the message! Let's connect and chat more about this.",
            "Appreciated! When would be a good time to talk?",
        ]
    );
}

// Post generation types
export type PostTone = "professional" | "casual" | "inspirational" | "educational";
export type PostFormat = "story" | "tips" | "announcement" | "question" | "carousel";

// Post generation
export async function generatePost(
    topic: string,
    tone: PostTone,
    format: PostFormat,
    keywords: string[] = [],
    language: "en" | "vi" = "en"
): Promise<{ content: string; hashtags: string[] }[]> {
    const systemPrompt = `You are a LinkedIn content expert who creates viral, engaging posts that get high engagement.

CRITICAL FORMATTING RULES (MUST FOLLOW):
1. Start with a powerful hook line that stops the scroll (use emoji if appropriate)
2. Add a BLANK LINE after the hook
3. Use VERY SHORT paragraphs (1-2 sentences max)
4. Add BLANK LINES between each paragraph for readability  
5. Use line breaks generously - LinkedIn posts with whitespace perform better
6. Include relevant emojis (but not too many, 3-5 total)
7. End with a question or call-to-action to drive engagement
8. Write in ${language === "vi" ? "Vietnamese" : "English"}

EXAMPLE FORMAT:
🚀 [Hook line that grabs attention]

[First short point]

[Second short point]

[Third point with insight]

💡 [Key takeaway]

What are your thoughts? 👇

RETURN FORMAT: JSON object with "posts" array containing exactly 2 variations:
{
  "posts": [
    {"content": "full post text with proper line breaks", "hashtags": ["tag1", "tag2", "tag3"]},
    {"content": "another variation", "hashtags": ["tag1", "tag2", "tag3"]}
  ]
}`;

    const formatInstructions: Record<PostFormat, string> = {
        story: "Tell a compelling personal story with a clear lesson. Start with a hook, build tension, reveal the insight.",
        tips: "Share 3-5 actionable tips in a numbered list format. Each tip should be on its own line with an emoji.",
        announcement: "Announce exciting news with context. Show gratitude. Include what's next.",
        question: "Ask a thought-provoking question that sparks discussion. Provide context before the question.",
        carousel: "Create content for each slide of a carousel. Number each slide content clearly.",
    };

    const userPrompt = `Create 2 LinkedIn posts about: ${topic}

Tone: ${tone}
Format: ${formatInstructions[format]}
${keywords.length > 0 ? `Include keywords: ${keywords.join(", ")}` : ""}

Remember: Use BLANK LINES between paragraphs. Make it ready to copy-paste to LinkedIn.`;

    return callAIWithFallback(
        systemPrompt,
        userPrompt,
        (content) => {
            const parsed = JSON.parse(content);
            return parsed.posts || [];
        },
        [{ content: `Here's a post about: ${topic}`, hashtags: ["linkedin", "professional"] }]
    );
}

// Profile analysis
export interface ProfileSection {
    score: number;
    maxScore: number;
    feedback: string[];
}

export interface ProfileAnalysis {
    overallScore: number;
    sections: {
        photo: ProfileSection;
        headline: ProfileSection;
        about: ProfileSection;
        experience: ProfileSection;
        skills: ProfileSection;
        other: ProfileSection;
    };
    suggestions: {
        section: string;
        priority: "high" | "medium" | "low";
        suggestion: string;
        example?: string;
    }[];
}

export async function analyzeProfile(
    profileData: {
        headline?: string;
        about?: string;
        experience?: unknown[];
        skills?: string[];
        hasPhoto?: boolean;
        education?: unknown[];
        certifications?: unknown[];
    }
): Promise<ProfileAnalysis> {
    const systemPrompt = `You are a LinkedIn profile optimization expert.
Analyze the provided profile data and return a detailed assessment.

Scoring criteria (100 points total):
- Photo: 10 points (professional headshot)
- Headline: 15 points (value proposition, not just job title)
- About: 20 points (compelling story, clear value)
- Experience: 25 points (quantified achievements)
- Skills: 15 points (relevant, endorsed)
- Other: 15 points (education, certifications, recommendations)

Return ONLY valid JSON with this exact structure:
{
  "overallScore": number,
  "sections": {
    "photo": {"score": number, "maxScore": 10, "feedback": ["string"]},
    "headline": {"score": number, "maxScore": 15, "feedback": ["string"]},
    "about": {"score": number, "maxScore": 20, "feedback": ["string"]},
    "experience": {"score": number, "maxScore": 25, "feedback": ["string"]},
    "skills": {"score": number, "maxScore": 15, "feedback": ["string"]},
    "other": {"score": number, "maxScore": 15, "feedback": ["string"]}
  },
  "suggestions": [
    {"section": "string", "priority": "high"|"medium"|"low", "suggestion": "string", "example": "string"}
  ]
}`;

    const defaultAnalysis: ProfileAnalysis = {
        overallScore: 50,
        sections: {
            photo: { score: profileData.hasPhoto ? 10 : 0, maxScore: 10, feedback: [] },
            headline: { score: profileData.headline ? 10 : 0, maxScore: 15, feedback: [] },
            about: { score: profileData.about ? 15 : 0, maxScore: 20, feedback: [] },
            experience: { score: (profileData.experience?.length || 0) * 5, maxScore: 25, feedback: [] },
            skills: { score: Math.min((profileData.skills?.length || 0) * 1.5, 15), maxScore: 15, feedback: [] },
            other: { score: 5, maxScore: 15, feedback: [] },
        },
        suggestions: [],
    };

    return callAIWithFallback(
        systemPrompt,
        `Profile data: ${JSON.stringify(profileData)}`,
        (content) => JSON.parse(content) as ProfileAnalysis,
        defaultAnalysis
    );
}

// Job matching
export interface JobMatchResult {
    overallScore: number;
    categories: {
        skills: { score: number; matched: string[]; missing: string[] };
        experience: { score: number; matched: string[]; missing: string[] };
        education: { score: number; matched: string[]; missing: string[] };
    };
    recommendations: string[];
}

export async function analyzeJobMatch(
    profileData: unknown,
    jobData: {
        title: string;
        company: string;
        description: string;
    }
): Promise<JobMatchResult> {
    const systemPrompt = `You are a career advisor analyzing profile-job fit.
Compare the candidate's profile with the job requirements and return a match analysis.

Return ONLY valid JSON with this exact structure:
{
  "overallScore": 0-100,
  "categories": {
    "skills": {"score": 0-100, "matched": ["skill1", "skill2"], "missing": ["skill3"]},
    "experience": {"score": 0-100, "matched": ["exp1"], "missing": ["exp2"]},
    "education": {"score": 0-100, "matched": ["edu1"], "missing": ["edu2"]}
  },
  "recommendations": ["recommendation1", "recommendation2"]
}`;

    const defaultResult: JobMatchResult = {
        overallScore: 50,
        categories: {
            skills: { score: 50, matched: [], missing: [] },
            experience: { score: 50, matched: [], missing: [] },
            education: { score: 50, matched: [], missing: [] },
        },
        recommendations: [],
    };

    return callAIWithFallback(
        systemPrompt,
        `Profile: ${JSON.stringify(profileData)}\n\nJob: ${JSON.stringify(jobData)}`,
        (content) => JSON.parse(content) as JobMatchResult,
        defaultResult
    );
}
