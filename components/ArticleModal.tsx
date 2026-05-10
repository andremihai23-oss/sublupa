'use client';

import React, { useEffect } from 'react';
import { X, CalendarDays, User } from 'lucide-react';
import { formatDate, getVideoEmbedUrl, isDirectVideoUrl } from '@/lib/utils';
import type { Article } from '@/lib/types';

interface Props {
  article: Article;
  onClose: () => void;
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((https?:\/\/[^\s)]+)\))/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
    if (match[0].startsWith('**')) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[0].startsWith('*')) {
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else {
      parts.push(
        <a key={match.index} href={match[5]} target="_blank" rel="noopener noreferrer" className="text-accent-400 underline hover:text-accent-300 transition-colors">
          {match[4]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return parts;
}

function renderContent(content: string) {
  return content.split('\n').map((line, idx) => {
    const imageMatch = line.match(/^\[image:\s*(.+?)\s*\|\s*(.+?)\s*\]$/);
    if (imageMatch) {
      const [, url, caption] = imageMatch;
      return (
        <figure key={idx} className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={caption} className="w-full h-auto rounded-xl object-cover" />
          {caption && (
            <figcaption className="text-center text-sm text-slate-500 mt-2 italic">{caption}</figcaption>
          )}
        </figure>
      );
    }

    const videoMatch = line.match(/^\[video:\s*(.+?)\s*\|\s*(.+?)\s*\]$/);
    if (videoMatch) {
      const [, url, caption] = videoMatch;
      const embedUrl = getVideoEmbedUrl(url);
      const isDirect = isDirectVideoUrl(url);
      return (
        <figure key={idx} className="my-6">
          <div className="aspect-video rounded-xl overflow-hidden bg-navy-900">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={caption}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : isDirect ? (
              <video src={url} controls className="w-full h-full" />
            ) : null}
          </div>
          {caption && (
            <figcaption className="text-center text-sm text-slate-500 mt-2 italic">{caption}</figcaption>
          )}
        </figure>
      );
    }

    if (line.startsWith('## ')) {
      return <h2 key={idx} className="text-xl font-bold text-white mt-6 mb-2">{parseInline(line.slice(3))}</h2>;
    }

    if (line.startsWith('### ')) {
      return <h3 key={idx} className="text-lg font-semibold text-white mt-5 mb-1">{parseInline(line.slice(4))}</h3>;
    }

    if (line.trim()) return <p key={idx}>{parseInline(line)}</p>;
    return <br key={idx} />;
  });
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-800/80 to-transparent" />
            </div>
          )}

          {/* Body */}
          <div className="p-6 sm:p-10">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs font-semibold text-accent-400 bg-accent-500/10 border border-accent-500/20 px-3 py-1 rounded-full">
                Article
              </span>
              {article.author && (
                <span className="flex items-center gap-1.5 text-xs text-slate-300">
                  <User className="w-3.5 h-3.5" />
                  {article.author}
                </span>
              )}
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

            {/* Article content with inline images/videos */}
            <div className="article-content">
              {renderContent(article.content)}
            </div>

            {/* Bottom video embed (cover video) */}
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
                    <video src={article.video_url} controls className="w-full h-full" />
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




