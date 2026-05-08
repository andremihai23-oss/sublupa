'use client';

import { useState } from 'react';
import ArticleCard from './ArticleCard';
import ArticleModal from './ArticleModal';
import type { Article } from '@/lib/types';

interface Props {
  articles: Article[];
}

export default function ArticleGrid({ articles }: Props) {
  const [selected, setSelected] = useState<Article | null>(null);

  if (articles.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
        <div className="text-center text-slate-500 py-16">
          <p className="text-lg">More articles coming soon.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Latest Stories
          </h2>
          <span className="h-px flex-1 ml-6 bg-navy-700 opacity-60" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onClick={() => setSelected(article)}
            />
          ))}
        </div>
      </section>

      {selected && (
        <ArticleModal article={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
