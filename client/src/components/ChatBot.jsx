import React, { useState, useRef, useEffect } from 'react';
import API_BASE_URL from '../config';
import { HiChatBubbleLeftRight, HiXMark, HiPaperAirplane, HiTrash, HiSparkles, HiUser, HiAcademicCap } from 'react-icons/hi2';
import './ChatBot.css';

/**
 * Floating RAG ChatBot widget for the Student Dashboard.
 * Communicates with POST /api/chat using the student's JWT token.
 * The backend handles privacy enforcement — the frontend just sends messages.
 */
function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
    const [cooldown, setCooldown] = useState(0); // seconds remaining

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const cooldownRef = useRef(null);

    // Auto-scroll to the latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Load chat history when panel opens for the first time
    useEffect(() => {
        if (isOpen && !hasLoadedHistory) {
            loadHistory();
        }
    }, [isOpen]);

    // Cleanup cooldown timer
    useEffect(() => {
        return () => {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
        };
    }, []);

    const startCooldown = (seconds = 5) => {
        setCooldown(seconds);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(cooldownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const getToken = () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr).token : null;
    };

    const loadHistory = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/api/chat/history?limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (res.ok) {
                const history = await res.json();
                setMessages(history.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    sources: msg.sources || [],
                })));
            }
        } catch (err) {
            console.error('Failed to load chat history:', err);
        } finally {
            setHasLoadedHistory(true);
        }
    };

    const sendMessage = async (text = null) => {
        const messageText = (text || input).trim();
        if (!messageText || isLoading || cooldown > 0) return;

        const token = getToken();
        if (!token) return;

        // Add user message immediately
        const userMessage = { role: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ message: messageText }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: data.reply,
                        sources: data.sources || [],
                    },
                ]);
                // Start cooldown only for non-cached responses
                if (!data.cached) {
                    startCooldown(5);
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: errData.message || 'Sorry, I encountered an error. Please try again.',
                    },
                ]);
            }
        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Unable to connect to the server. Please check your connection and try again.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = async () => {
        if (!window.confirm('Clear your entire chat history?')) return;

        try {
            const token = getToken();
            if (!token) return;

            await fetch(`${API_BASE_URL}/api/chat/history`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            setMessages([]);
        } catch (err) {
            console.error('Failed to clear history:', err);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Format assistant messages with basic markdown
    const formatMessage = (text) => {
        if (!text) return '';

        return text
            // Bold
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Bullet points
            .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
            // Wrap consecutive <li> in <ul>
            .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
            // Emoji-prefixed lines as paragraphs
            .replace(/\n/g, '<br/>');
    };

    const SUGGESTIONS = [
        'How am I doing in my courses?',
        'What tasks do I need to complete?',
        'How many points do I have?',
        'What courses am I enrolled in?',
    ];

    return (
        <>
            {/* Floating Action Button */}
            <button
                className={`chatbot-fab ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close chat' : 'Open AI Assistant'}
                id="chatbot-fab"
            >
                {isOpen ? <HiXMark /> : <HiChatBubbleLeftRight />}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="chatbot-panel" id="chatbot-panel">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-left">
                            <div className="chatbot-avatar">
                                <HiSparkles />
                            </div>
                            <div className="chatbot-header-info">
                                <h4>SamVidyaa AI</h4>
                                <span>Your Academic Advisor</span>
                            </div>
                        </div>
                        <div className="chatbot-header-actions">
                            <button
                                className="chatbot-header-btn"
                                onClick={clearHistory}
                                title="Clear chat history"
                                aria-label="Clear chat history"
                            >
                                <HiTrash />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages" id="chatbot-messages">
                        {messages.length === 0 && !isLoading ? (
                            <div className="chatbot-welcome">
                                <div className="chatbot-welcome-icon"><HiAcademicCap /></div>
                                <h4>Hi! I'm SamVidyaa AI</h4>
                                <p>
                                    I can help you with your courses, track your progress,
                                    answer questions about assignments, and more!
                                </p>
                                <div className="chatbot-suggestions">
                                    {SUGGESTIONS.map((s, i) => (
                                        <button
                                            key={i}
                                            className="chatbot-suggestion-chip"
                                            onClick={() => sendMessage(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, index) => (
                                    <div key={index} className={`chatbot-msg ${msg.role}`}>
                                        <div className="chatbot-msg-avatar">
                                            {msg.role === 'user' ? <HiUser /> : <HiSparkles />}
                                        </div>
                                        <div
                                            className="chatbot-msg-bubble"
                                            dangerouslySetInnerHTML={{
                                                __html: msg.role === 'assistant'
                                                    ? formatMessage(msg.content)
                                                    : msg.content,
                                            }}
                                        />
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {isLoading && (
                                    <div className="chatbot-typing">
                                        <div className="chatbot-msg-avatar assistant">
                                            <HiSparkles />
                                        </div>
                                        <div className="chatbot-typing-dots">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="chatbot-input-area">
                        <textarea
                            ref={inputRef}
                            className="chatbot-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={cooldown > 0 ? `Wait ${cooldown}s...` : "Ask me anything about your courses..."}
                            rows={1}
                            disabled={isLoading || cooldown > 0}
                            id="chatbot-input"
                        />
                        <button
                            className="chatbot-send-btn"
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading || cooldown > 0}
                            aria-label="Send message"
                            id="chatbot-send"
                            title={cooldown > 0 ? `Cooldown: ${cooldown}s` : 'Send message'}
                        >
                            {cooldown > 0 ? cooldown : <HiPaperAirplane />}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default ChatBot;
