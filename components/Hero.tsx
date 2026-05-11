'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CalendarDays, ArrowRight, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import ArticleModal from './ArticleModal';
import type { Article } from '@/lib/types';

interface Props {
  article: Article | null;
}

export default function Hero({ article }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className="pt-28 pb-6 px-5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative w-full h-[350px] sm:h-[600px] lg:h-[68vh] rounded-3xl overflow-hidden group bg-navy-950">
          {/* Background image */}
          {article?.cover_image_url ? (
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy-700 via-navy-800 to-navy-900" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-900/50 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-10 lg:p-12">
            {article ? (
              <div className="animate-slide-up max-w-3xl">
                {/* Tag */}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent-500/20 text-accent-400 border border-accent-500/30 mb-4">
                  Latest Article
                </span>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
                  {article.title}
                </h1>

                {/* Excerpt */}
                <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6 max-w-2xl line-clamp-2">
                  {article.excerpt}
                </p>

                {/* Meta + CTA */}
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-accent-500/30 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Read Article
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {article.author && (
                    <span className="flex items-center gap-1.5 text-sm text-slate-300">
                      <User className="w-4 h-4" />
                      {article.author}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-slate-400">
                    <CalendarDays className="w-4 h-4" />
                    {formatDate(article.published_at)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
                  Sub<span className="text-accent-500">Lupa</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-md">
                  Your premium sports & media destination. Articles coming soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {article && modalOpen && (
        <ArticleModal article={article} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}






