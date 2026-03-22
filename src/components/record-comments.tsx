"use client";

import { useState } from "react";
import useSWR from "swr";
import { MessageSquare, Send, Pencil, Trash2, X, Check } from "lucide-react";

type Comment = {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CURRENT_USER = "福田 奈美絵"; // TODO: Replace with auth user

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}時間前`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}日前`;
  return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

export function RecordComments({
  targetType,
  targetId,
}: {
  targetType: string;
  targetId: string;
}) {
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: comments, mutate } = useSWR<Comment[]>(
    targetId ? `/api/comments?targetType=${targetType}&targetId=${targetId}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const handlePost = async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          body: newComment.trim(),
          authorName: CURRENT_USER,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setNewComment("");
      mutate();
    } catch {
      // silent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editBody.trim()) return;
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setEditingId(null);
      mutate();
    } catch {
      // silent
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このコメントを削除しますか？")) return;
    try {
      await fetch(`/api/comments/${id}`, { method: "DELETE" });
      mutate();
    } catch {
      // silent
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditBody(comment.body);
  };

  const list = comments ?? [];

  return (
    <div className="border-t border-border pt-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-text-secondary" />
        <span className="text-sm font-medium text-text">コメント</span>
        {list.length > 0 && (
          <span className="text-xs text-text-tertiary">({list.length})</span>
        )}
      </div>

      {/* コメント一覧 */}
      {list.length > 0 && (
        <div className="space-y-3 mb-3 max-h-[300px] overflow-y-auto">
          {list.map((c) => {
            const isOwn = c.authorName === CURRENT_USER;
            const isEditing = editingId === c.id;
            const wasEdited = c.updatedAt !== c.createdAt;

            return (
              <div key={c.id} className="group flex gap-2.5">
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-medium text-primary-700">
                    {c.authorName.slice(0, 2)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text">{c.authorName}</span>
                    <span className="text-[10px] text-text-tertiary">{timeAgo(c.createdAt)}</span>
                    {wasEdited && <span className="text-[10px] text-text-tertiary">(編集済み)</span>}

                    {/* Actions */}
                    {isOwn && !isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-auto transition-opacity">
                        <button
                          onClick={() => startEdit(c)}
                          className="p-1 hover:bg-surface-tertiary rounded"
                          title="編集"
                        >
                          <Pencil className="w-3 h-3 text-text-tertiary" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1 hover:bg-red-50 rounded"
                          title="削除"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="text"
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleEdit(c.id); if (e.key === "Escape") setEditingId(null); }}
                        className="flex-1 px-2 py-1 text-sm border border-primary-300 rounded bg-surface focus:ring-1 focus:ring-primary-500"
                        autoFocus
                      />
                      <button onClick={() => handleEdit(c.id)} className="p-1 text-primary-600 hover:bg-primary-50 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-text-tertiary hover:bg-surface-tertiary rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary mt-0.5 whitespace-pre-wrap break-words">{c.body}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 入力フォーム */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-medium text-primary-700">
            {CURRENT_USER.slice(0, 2)}
          </span>
        </div>
        <div className="flex-1 flex items-center gap-1.5">
          <input
            type="text"
            placeholder="コメントを入力..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
            className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={handlePost}
            disabled={!newComment.trim() || isSubmitting}
            className="p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
