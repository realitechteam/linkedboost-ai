import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { canSuggestReply, recordReplySuggestion } from '../../lib/linkedinApi';
export function ReplyHelper({ messageInput }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [rateLimitMessage, setRateLimitMessage] = useState(null);
    const vietnameseFallback = [
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
        }
        catch (error) {
            console.error('Failed to get suggestions:', error);
            // Fallback suggestions in Vietnamese
            setSuggestions(vietnameseFallback);
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
                }, children: [_jsxs("div", { className: "linkedboost-suggestions-header", children: [_jsxs("div", { className: "linkedboost-suggestions-title", children: [_jsx(Sparkles, { size: 16, color: "#0ea5e9" }), _jsx("span", { children: "Reply Suggestions" })] }), _jsx("button", { className: "linkedboost-suggestions-close", onClick: () => setIsOpen(false), children: _jsx(X, { size: 16 }) })] }), rateLimitMessage ? (_jsx("div", { className: "linkedboost-loading", children: _jsx("span", { className: "linkedboost-loading-text", style: { color: '#f59e0b' }, children: rateLimitMessage }) })) : isLoading ? (_jsxs("div", { className: "linkedboost-loading", children: [_jsx("div", { className: "linkedboost-spinner" }), _jsx("span", { className: "linkedboost-loading-text", children: "Generating suggestions..." })] })) : (_jsx("div", { className: "linkedboost-suggestions-list", children: suggestions.map((suggestion, index) => (_jsxs("div", { className: "linkedboost-suggestion-item", onClick: () => handleSelectSuggestion(suggestion), children: [_jsx("span", { className: `linkedboost-suggestion-tone ${toneColors[suggestion.tone]} text-white px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide inline-block mb-2`, children: suggestion.tone }), _jsx("p", { className: "linkedboost-suggestion-text", children: suggestion.text })] }, index))) }))] }))] }));
}
//# sourceMappingURL=ReplyHelper.js.map