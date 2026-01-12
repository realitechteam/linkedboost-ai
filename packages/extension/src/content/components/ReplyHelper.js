import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
export function ReplyHelper({ messageInput }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
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
        }
        catch (error) {
            console.error('Failed to get suggestions:', error);
            // Fallback suggestions
            setSuggestions([
                { tone: 'professional', text: 'Thank you for reaching out. I would be happy to discuss this further. Let me know your availability for a call.' },
                { tone: 'friendly', text: 'Hey! Thanks for the message. Sounds interesting - would love to chat more about this. When works for you?' },
                { tone: 'concise', text: 'Thanks for connecting. Happy to discuss. Free this week?' },
            ]);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSelectSuggestion = (suggestion) => {
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
    return (_jsxs(_Fragment, { children: [_jsxs("button", { className: "linkedboost-reply-btn", onClick: handleClick, title: "AI Reply Suggestions", children: [_jsx(Sparkles, { size: 16 }), _jsx("span", { children: "AI Reply" })] }), isOpen && (_jsxs("div", { className: "linkedboost-suggestions", style: {
                    position: 'absolute',
                    bottom: '60px',
                    left: '0',
                }, children: [_jsxs("div", { className: "linkedboost-suggestions-header", children: [_jsxs("div", { className: "linkedboost-suggestions-title", children: [_jsx(Sparkles, { size: 16, color: "#0ea5e9" }), _jsx("span", { children: "Reply Suggestions" })] }), _jsx("button", { className: "linkedboost-suggestions-close", onClick: () => setIsOpen(false), children: _jsx(X, { size: 16 }) })] }), isLoading ? (_jsxs("div", { className: "linkedboost-loading", children: [_jsx("div", { className: "linkedboost-spinner" }), _jsx("span", { className: "linkedboost-loading-text", children: "Generating suggestions..." })] })) : (_jsx("div", { className: "linkedboost-suggestions-list", children: suggestions.map((suggestion, index) => (_jsxs("div", { className: "linkedboost-suggestion-item", onClick: () => handleSelectSuggestion(suggestion), children: [_jsx("span", { className: `linkedboost-suggestion-tone ${toneColors[suggestion.tone]} text-white px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide inline-block mb-2`, children: suggestion.tone }), _jsx("p", { className: "linkedboost-suggestion-text", children: suggestion.text })] }, index))) }))] }))] }));
}
//# sourceMappingURL=ReplyHelper.js.map