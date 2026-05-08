'use client';

import Image from 'next/image';
import { Pencil, Trash2, CalendarDays } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Article } from '@/lib/types';

interface Props {
  articles: Article[];
  onEdit: (article: Article) => void;
  onDelete: (id: string) => void;
}

export default function ArticleList({ articles, onEdit, onDelete }: Props) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg font-medium mb-2">No articles yet</p>
        <p className="text-sm">Click &ldquo;New Article&rdquo; to publish your first piece.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <div
          key={article.id}
          className="flex items-center gap-4 p-4 bg-navy-900 rounded-2xl border border-navy-700/50 hover:border-navy-600 transition-colors group"
        >
          {/* Thumbnail */}
          <div className="relative w-16 h-14 rounded-xl overflow-hidden shrink-0 bg-navy-700">
            {article.cover_image_url ? (
              <Image
                src={article.cover_image_url}
                alt={article.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs font-black text-navy-500">SL</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{article.title}</h3>
            <p className="text-xs text-slate-500 truncate mt-0.5">{article.excerpt}</p>
            <span className="flex items-center gap-1 text-xs text-slate-600 mt-1">
              <CalendarDays className="w-3 h-3" />
              {formatDate(article.published_at)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(article)}
              className="p-2 text-slate-400 hover:text-accent-400 hover:bg-navy-700 rounded-lg transition-all"
              aria-label="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${article.title}"?`)) onDelete(article.id);
              }}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
