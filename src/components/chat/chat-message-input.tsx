"use client";

import { Send } from "lucide-react";
import { useState } from "react";

export function ChatMessageInput({
  onSend,
  disabled,
}: {
  onSend: (body: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || sending || disabled) return;
    setSending(true);
    try {
      await onSend(text.trim());
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-3 border-t border-border bg-surface shrink-0">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="メッセージを入力..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={disabled}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-surface-secondary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
