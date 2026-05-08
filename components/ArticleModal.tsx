'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X, CalendarDays } from 'lucide-react';
import { formatDate, getVideoEmbedUrl, isDirectVideoUrl } from '@/lib/utils';
import type { Article } from '@/lib/types';

interface Props {
  article: Article;
  onClose: () => void;
}

export default function ArticleModal({ article, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const embedUrl = article.video_url ? getVideoEmbedUrl(article.video_url) : null;
  const isDirectVideo = article.video_url ? isDirectVideoUrl(article.video_url) : false;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={article.title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[88vh] bg-navy-800 sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-navy-900/80 hover:bg-navy-700 text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {/* Cover image */}
          {article.cover_image_url && (
            <div className="relative h-56 sm:h-72 w-full shrink-0">
              <Image
                src={article.cover_image_url}
                alt={article.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-800/80 to-transparent" />
            </div>
          )}

          {/* Body */}
          <div className="p-6 sm:p-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-accent-400 bg-accent-500/10 border border-accent-500/20 px-3 py-1 rounded-full">
                Article
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDate(article.published_at)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-4 tracking-tight">
              {article.title}
            </h1>

            <p className="text-slate-300 text-base font-medium mb-6 leading-relaxed border-l-2 border-accent-500 pl-4 italic">
              {article.excerpt}
            </p>

            {/* Article content */}
            <div className="article-content">
              {article.content.split('\n').map((paragraph, idx) =>
                paragraph.trim() ? (
                  <p key={idx}>{paragraph}</p>
                ) : (
                  <br key={idx} />
                )
              )}
            </div>

            {/* Video embed */}
            {article.video_url && (
              <div className="mt-8">
                <div className="aspect-video rounded-2xl overflow-hidden bg-navy-900">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title="Article video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : isDirectVideo ? (
                    <video
                      src={article.video_url}
                      controls
                      className="w-full h-full"
                    />
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
