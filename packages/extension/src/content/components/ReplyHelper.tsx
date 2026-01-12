import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

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

    const handleClick = async () => {
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        setIsOpen(true);
        setIsLoading(true);

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

            setSuggestions(response.data?.suggestions || [
                { tone: 'professional', text: 'Thank you for reaching out. I would be happy to discuss this further. Let me know your availability for a call.' },
                { tone: 'friendly', text: 'Hey! Thanks for the message. Sounds interesting - would love to chat more about this. When works for you?' },
                { tone: 'concise', text: 'Thanks for connecting. Happy to discuss. Free this week?' },
            ]);
        } catch (error) {
            console.error('Failed to get suggestions:', error);
            // Fallback suggestions
            setSuggestions([
                { tone: 'professional', text: 'Thank you for reaching out. I would be happy to discuss this further. Let me know your availability for a call.' },
                { tone: 'friendly', text: 'Hey! Thanks for the message. Sounds interesting - would love to chat more about this. When works for you?' },
                { tone: 'concise', text: 'Thanks for connecting. Happy to discuss. Free this week?' },
            ]);
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

                    {isLoading ? (
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
