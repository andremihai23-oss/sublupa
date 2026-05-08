'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Search, X, CalendarDays } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import ArticleModal from './ArticleModal';
import type { Article } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Article | null>(null);
  const supabase = createClient();

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) { setResults([]); return; }
      setLoading(true);
      const { data } = await supabase
        .from('articles')
        .select('*')
        .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%`)
        .order('published_at', { ascending: false })
        .limit(8);
      setResults(data ?? []);
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (!isOpen) { setQuery(''); setResults([]); }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (selected) {
    return (
      <ArticleModal
        article={selected}
        onClose={() => { setSelected(null); onClose(); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-20 sm:pt-28">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-950/75 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Search box */}
      <div className="relative w-full max-w-2xl bg-navy-800 rounded-2xl shadow-2xl border border-navy-700/60 overflow-hidden animate-slide-up">
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-navy-700/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search articles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-base outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-white border border-navy-600 rounded-lg transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <p className="text-center text-slate-500 py-10 text-sm">
              No articles found for &ldquo;{query}&rdquo;
            </p>
          )}

          {!loading && results.length > 0 && (
            <ul className="divide-y divide-navy-700/40">
              {results.map((article) => (
                <li key={article.id}>
                  <button
                    onClick={() => setSelected(article)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-navy-700/40 transition-colors text-left group"
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-navy-700">
                      {article.cover_image_url && (
                        <Image
                          src={article.cover_image_url}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-accent-400 transition-colors truncate">
                        {article.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {article.excerpt}
                      </p>
                      <span className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(article.published_at)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!query && (
            <p className="text-center text-slate-600 py-10 text-sm">
              Start typing to search articles
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
