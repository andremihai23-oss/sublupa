import Image from 'next/image';
import { CalendarDays, ArrowUpRight, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Article } from '@/lib/types';

interface Props {
  article: Article;
  onClick: () => void;
}

export default function ArticleCard({ article, onClick }: Props) {
  return (
    <article
      onClick={onClick}
      className="group cursor-pointer bg-navy-800 rounded-2xl overflow-hidden border border-navy-700/50 hover:border-accent-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy-950/60"
    >
      {/* Cover image */}
      <div className="relative h-48 overflow-hidden">
        {article.cover_image_url ? (
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center">
            <span className="text-2xl font-black text-navy-500 select-none">SL</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-800/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-white leading-snug mb-2 group-hover:text-accent-400 transition-colors duration-200 line-clamp-2">
          {article.title}
        </h3>

        <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">
          {article.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            {article.author && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <User className="w-3.5 h-3.5" />
                {article.author}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatDate(article.published_at)}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-accent-500 group-hover:gap-2 transition-all duration-200">
            Read
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

