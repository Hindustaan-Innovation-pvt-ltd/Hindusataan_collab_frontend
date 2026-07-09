import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import type { LiveChatMessage } from '../services/liveChatService';

interface BoardChatProps {
  messages: LiveChatMessage[];
  currentUserId: string;
  typingUsers: string[]; // List of names
  onSendMessage: (msg: string) => void;
  onTyping: (isTyping: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onToggle: () => void;
}

export function BoardChat({
  messages,
  currentUserId,
  typingUsers,
  onSendMessage,
  onTyping,
  isOpen,
  onClose,
  unreadCount,
  onToggle
}: BoardChatProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, typingUsers]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText("");
      onTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    
    // Typing indicator logic
    onTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden font-sans animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="bg-[#7B61FF] px-4 py-3 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} />
          <h3 className="font-semibold">Board Chat</h3>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
        {(messages || []).map((msg, i) => {
          const isMe = msg?.user_id === currentUserId;
          const showHeader = i === 0 || (messages[i-1] && messages[i-1].user_id !== msg?.user_id);
          const safeMessage = typeof msg?.message === 'string' ? msg.message : "";
          
          return (
            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {showHeader && (
                <span className="text-xs text-gray-500 mb-1 ml-1">{isMe ? 'You' : msg.username}</span>
              )}
              <div 
                className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${
                  isMe 
                    ? 'bg-[#7B61FF] text-white rounded-br-sm' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                }`}
                style={{ wordBreak: 'break-word' }}
              >
                {safeMessage.split('\n').map((line, j) => (
                  <React.Fragment key={j}>
                    {line}
                    {j < safeMessage.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
        
        {(typingUsers || []).length > 0 && (
          <div className="text-xs text-gray-500 italic ml-1 animate-pulse">
            {(typingUsers || []).join(', ')} {(typingUsers || []).length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-end">
        <textarea
          value={inputText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 max-h-32 min-h-[40px] resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B61FF] focus:border-transparent"
          rows={1}
        />
        <button 
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="bg-[#7B61FF] hover:bg-[#6B4FF0] disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
