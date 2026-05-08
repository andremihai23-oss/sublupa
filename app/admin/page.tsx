'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, LogOut, Upload, Loader2, ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ArticleForm from '@/components/admin/ArticleForm';
import ArticleList from '@/components/admin/ArticleList';
import type { Article } from '@/lib/types';

type View = 'list' | 'new' | 'edit';

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [articles, setArticles] = useState<Article[]>([]);
  const [view, setView] = useState<View>('list');
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [tab, setTab] = useState<'articles' | 'settings'>('articles');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const loadArticles = useCallback(async () => {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false });
    setArticles(data ?? []);
  }, [supabase]);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('*').limit(1);
    if (data?.[0]) {
      setLogoUrl(data[0].logo_url);
      setSettingsId(data[0].id);
    }
  }, [supabase]);

  useEffect(() => {
    loadArticles();
    loadSettings();
  }, [loadArticles, loadSettings]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  async function handleDelete(id: string) {
    await supabase.from('articles').delete().eq('id', id);
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }

  function handleEdit(article: Article) {
    setEditingArticle(article);
    setView('edit');
  }

  async function handleFormSuccess() {
    await loadArticles();
    setView('list');
    setEditingArticle(null);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('logos').getPublicUrl(path);
      const url = data.publicUrl;

      if (settingsId) {
        await supabase
          .from('site_settings')
          .update({ logo_url: url, updated_at: new Date().toISOString() })
          .eq('id', settingsId);
      } else {
        const { data: inserted } = await supabase
          .from('site_settings')
          .insert({ logo_url: url })
          .select()
          .single();
        if (inserted) setSettingsId(inserted.id);
      }
      setLogoUrl(url);
    } catch (err) {
      console.error('Logo upload failed', err);
    } finally {
      setLogoLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-navy-800/90 backdrop-blur-md border-b border-navy-700/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="text-xl font-black text-white">
            Sub<span className="text-accent-500">Lupa</span>
            <span className="text-xs font-normal text-slate-500 ml-2">Admin</span>
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-navy-700 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-navy-800 rounded-2xl border border-navy-700/50 w-fit mb-8">
          {(['articles', 'settings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setView('list'); }}
              className={`px-5 py-2 text-sm font-semibold rounded-xl capitalize transition-all ${
                tab === t
                  ? 'bg-accent-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'articles' ? 'Articles' : 'Site Settings'}
            </button>
          ))}
        </div>

        {/* Articles tab */}
        {tab === 'articles' && (
          <div>
            {view === 'list' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Articles</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{articles.length} published</p>
                  </div>
                  <button
                    onClick={() => setView('new')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white font-semibold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-accent-500/25"
                  >
                    <Plus className="w-4 h-4" />
                    New Article
                  </button>
                </div>
                <ArticleList
                  articles={articles}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </>
            )}

            {(view === 'new' || view === 'edit') && (
              <div className="bg-navy-800 rounded-3xl border border-navy-700/50 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-white mb-6">
                  {view === 'new' ? 'New Article' : 'Edit Article'}
                </h2>
                <ArticleForm
                  article={editingArticle}
                  onSuccess={handleFormSuccess}
                  onCancel={() => { setView('list'); setEditingArticle(null); }}
                />
              </div>
            )}
          </div>
        )}

        {/* Settings tab */}
        {tab === 'settings' && (
          <div className="bg-navy-800 rounded-3xl border border-navy-700/50 p-6 sm:p-8 max-w-lg">
            <h2 className="text-lg font-bold text-white mb-1">Site Settings</h2>
            <p className="text-sm text-slate-500 mb-8">Manage your site logo and branding.</p>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Logo</label>

              {/* Current logo or placeholder */}
              <div className="flex items-center gap-5 mb-4">
                <div className="relative w-32 h-16 bg-navy-900 rounded-2xl border-2 border-dashed border-navy-600 overflow-hidden flex items-center justify-center">
                  {logoUrl ? (
                    <Image src={logoUrl} alt="Current logo" fill className="object-contain p-2" />
                  ) : (
                    <span className="text-xl font-black text-navy-600">SL</span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">
                    {logoUrl ? 'Current logo' : 'No logo uploaded'}
                  </p>
                  <p className="text-xs text-slate-600">Recommended: PNG or SVG, transparent background</p>
                </div>
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={logoLoading}
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-navy-700 hover:bg-navy-600 disabled:opacity-50 rounded-xl transition-colors border border-navy-600"
              >
                {logoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {logoUrl ? 'Replace Logo' : 'Upload Logo'}
              </button>

              {logoUrl && (
                <p className="mt-3 text-xs text-accent-500 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Logo active — visible in navbar
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
