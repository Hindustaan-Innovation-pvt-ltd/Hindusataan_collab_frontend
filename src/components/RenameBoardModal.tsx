import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { X, Smile } from 'lucide-react';

interface RenameBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (newName: string) => void;
}

export default function RenameBoardModal({ isOpen, onClose, currentName, onSave }: RenameBoardModalProps) {
  const [name, setName] = useState(currentName);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setShowEmojiPicker(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      if (name.trim() !== currentName) {
        onSave(name.trim());
      }
      onClose();
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setName((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto"
      onClick={onClose}
    >
      <div 
        className="bg-card text-card-foreground w-full max-w-md rounded-2xl shadow-xl border border-border p-6 flex flex-col gap-4 relative animate-in zoom-in-95 duration-200"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted text-gray-400 hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold">Rename Board</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1abc9c] focus:border-transparent transition-all pr-12"
              placeholder="Enter board name..."
            />
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-foreground hover:bg-muted transition-colors"
            >
              <Smile size={18} />
            </button>
          </div>

          {showEmojiPicker && (
            <div className="absolute top-[55px] right-0 z-[110] shadow-2xl rounded-xl overflow-hidden border border-border bg-card">
              <EmojiPicker 
                theme={Theme.AUTO} 
                onEmojiClick={handleEmojiClick}
                width={300}
                height={400}
                style={{ border: 'none', borderRadius: 0 }}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#1abc9c] text-white hover:bg-[#16a085] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
