
import React, { useRef, useEffect } from 'react';
import { Send, MessageCircle, User } from 'lucide-react';
import { Message } from '../../types';

interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (text: string) => void;
    placeholder?: string;
    senderRole: 'user' | 'store';
    title?: string;
    loading?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages,
    onSendMessage,
    placeholder = "Escreva uma mensagem...",
    senderRole,
    loading = false
}) => {
    const [text, setText] = React.useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!text.trim()) return;
        onSendMessage(text);
        setText('');
    };

    return (
        <div className="flex flex-col h-full bg-inherit">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30 no-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30">
                        <MessageCircle size={48} className="mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Nenhuma mensagem ainda</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender === senderRole;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-${isMe ? 'right' : 'left'}-4 fade-in duration-300`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl text-sm shadow-sm ${isMe
                                        ? senderRole === 'user'
                                            ? 'bg-red-600 text-white rounded-br-none shadow-red-100'
                                            : 'bg-blue-600 text-white rounded-br-none shadow-blue-100'
                                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                    }`}>
                                    <p className="font-bold leading-relaxed">{msg.text}</p>
                                    <p className={`text-[8px] mt-1 font-black uppercase opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                                        {msg.timestamp}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-white border-t mt-auto">
                <div className="relative flex items-center gap-3">
                    <input
                        type="text"
                        placeholder={placeholder}
                        className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-red-500/10 shadow-inner"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!text.trim() || loading}
                        className={`p-4 rounded-2xl shadow-xl transition-all ${text.trim()
                                ? senderRole === 'user' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-100 text-gray-300'
                            }`}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
