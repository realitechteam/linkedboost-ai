import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { canSuggestReply, recordReplySuggestion } from '../../lib/linkedinApi';

interface ReplyHelperProps {
    messageInput: HTMLElement;
}

interface Suggestion {
    tone: 'professional' | 'friendly' | 'concise';
    text: string;
}

export function ReplyHelper({ messageInput }: ReplyHelperProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

    const vietnameseFallback: Suggestion[] = [
        { tone: 'professional', text: 'Cảm ơn bạn đã liên hệ. Tôi rất vui được trao đổi thêm. Bạn có thể cho tôi biết thời gian phù hợp để nói chuyện không?' },
        { tone: 'friendly', text: 'Chào bạn! Cảm ơn tin nhắn nhé. Nghe hay đấy - mình muốn trao đổi thêm. Khi nào bạn rảnh?' },
        { tone: 'concise', text: 'Cảm ơn bạn. Rất vui được trao đổi. Tuần này bạn rảnh không?' },
    ];

    const handleClick = async () => {
        if (isOpen) {
            setIsOpen(false);
            setRateLimitMessage(null);
            return;
        }

        // Check rate limit before proceeding
        const rateLimitStatus = await canSuggestReply();
        if (!rateLimitStatus.canProceed) {
            setIsOpen(true);
            setRateLimitMessage(rateLimitStatus.message || 'Đã đạt giới hạn. Vui lòng đợi.');
            return;
        }

        setIsOpen(true);
        setIsLoading(true);
        setRateLimitMessage(null);

        // Get conversation context
        const conversationEl = messageInput.closest('.msg-thread');
        const messages = conversationEl?.querySelectorAll('.msg-s-event-listitem__body');
        const context = Array.from(messages || [])
            .slice(-5)
            .map((m) => m.textContent?.trim())
            .filter(Boolean)
            .join('\n\n');

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'suggestReply',
                data: { context },
            });

            if (response.error) {
                throw new Error(response.error);
            }

            setSuggestions(response.data?.suggestions || vietnameseFallback);

            // Record successful suggestion for rate limiting
            await recordReplySuggestion();
        } catch (error) {
            console.error('Failed to get suggestions:', error);
            // Fallback suggestions in Vietnamese
            setSuggestions(vietnameseFallback);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectSuggestion = (suggestion: Suggestion) => {
        // Insert suggestion into LinkedIn message input
        if (messageInput) {
            // Find the actual contenteditable element
            const editableEl = messageInput.querySelector('[contenteditable="true"]') || messageInput;

            // Set the text content
            editableEl.textContent = suggestion.text;

            // Trigger input event for LinkedIn to detect change
            editableEl.dispatchEvent(new InputEvent('input', { bubbles: true }));

            setIsOpen(false);
        }
    };

    const toneColors = {
        professional: 'bg-[#0ea5e9]',
        friendly: 'bg-[#8b5cf6]',
        concise: 'bg-[#22c55e]',
    };

    return (
        <>
            <button
                className="linkedboost-reply-btn"
                onClick={handleClick}
                title="AI Reply Suggestions"
            >
                <Sparkles size={16} />
                <span>AI Reply</span>
            </button>

            {isOpen && (
                <div
                    className="linkedboost-suggestions"
                    style={{
                        position: 'absolute',
                        bottom: '60px',
                        left: '0',
                    }}
                >
                    <div className="linkedboost-suggestions-header">
                        <div className="linkedboost-suggestions-title">
                            <Sparkles size={16} color="#0ea5e9" />
                            <span>Reply Suggestions</span>
                        </div>
                        <button
                            className="linkedboost-suggestions-close"
                            onClick={() => setIsOpen(false)}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {rateLimitMessage ? (
                        <div className="linkedboost-loading">
                            <span className="linkedboost-loading-text" style={{ color: '#f59e0b' }}>{rateLimitMessage}</span>
                        </div>
                    ) : isLoading ? (
                        <div className="linkedboost-loading">
                            <div className="linkedboost-spinner" />
                            <span className="linkedboost-loading-text">Generating suggestions...</span>
                        </div>
                    ) : (
                        <div className="linkedboost-suggestions-list">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="linkedboost-suggestion-item"
                                    onClick={() => handleSelectSuggestion(suggestion)}
                                >
                                    <span className={`linkedboost-suggestion-tone ${toneColors[suggestion.tone]} text-white px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide inline-block mb-2`}>
                                        {suggestion.tone}
                                    </span>
                                    <p className="linkedboost-suggestion-text">{suggestion.text}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
