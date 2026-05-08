import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ArticleGrid from '@/components/ArticleGrid';
import Footer from '@/components/Footer';
import type { Article, SiteSettings } from '@/lib/types';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: articles }, { data: settingsRows }] = await Promise.all([
    supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(10),
    supabase.from('site_settings').select('*').limit(1),
  ]);

  const allArticles: Article[] = articles ?? [];
  const heroArticle = allArticles[0] ?? null;
  const cardArticles = allArticles.slice(1, 4);
  const settings: SiteSettings | null = settingsRows?.[0] ?? null;

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar logoUrl={settings?.logo_url ?? null} />
      <main>
        <Hero article={heroArticle} />
        <ArticleGrid articles={cardArticles} />
      </main>
      <Footer />
    </div>
  );
}
