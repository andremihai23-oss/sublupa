'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import type { Article } from '@/lib/types';

interface Props {
  article?: Article | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ArticleForm({ article, onSuccess, onCancel }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string>(article?.cover_image_url ?? '');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: article?.title ?? '',
    excerpt: article?.excerpt ?? '',
    content: article?.content ?? '',
    cover_image_url: article?.cover_image_url ?? '',
    video_url: article?.video_url ?? '',
    published_at: article?.published_at
      ? new Date(article.published_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  });

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function uploadFile(file: File, bucket: string): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadFile(file, 'article-images');
      update('cover_image_url', url);
      setImagePreview(url);
    } catch {
      setError('Image upload failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadFile(file, 'article-videos');
      update('video_url', url);
    } catch {
      setError('Video upload failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setLoading(true);
    setError('');

    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      cover_image_url: form.cover_image_url || null,
      video_url: form.video_url || null,
      published_at: new Date(form.published_at).toISOString(),
      slug: article?.slug ?? generateSlug(form.title),
    };

    const { error: dbError } = article?.id
      ? await supabase.from('articles').update(payload).eq('id', article.id)
      : await supabase.from('articles').insert(payload);

    if (dbError) {
      setError(dbError.message);
    } else {
      onSuccess();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          className="w-full px-4 py-2.5 bg-navy-900 border border-navy-600 rounded-xl text-white placeholder-slate-600 focus:border-accent-500 focus:outline-none transition-colors text-sm"
          placeholder="Article title"
          required
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Excerpt</label>
        <textarea
          value={form.excerpt}
          onChange={(e) => update('excerpt', e.target.value)}
          rows={2}
          className="w-full px-4 py-2.5 bg-navy-900 border border-navy-600 rounded-xl text-white placeholder-slate-600 focus:border-accent-500 focus:outline-none transition-colors text-sm resize-none"
          placeholder="Short description shown in preview cards"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Content</label>
        <textarea
          value={form.content}
          onChange={(e) => update('content', e.target.value)}
          rows={8}
          className="w-full px-4 py-2.5 bg-navy-900 border border-navy-600 rounded-xl text-white placeholder-slate-600 focus:border-accent-500 focus:outline-none transition-colors text-sm resize-y"
          placeholder="Write your article content here…"
        />
      </div>

      {/* Cover image */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Cover Image</label>
        <div className="flex items-start gap-4">
          {/* Preview */}
          <div
            onClick={() => imageInputRef.current?.click()}
            className="relative w-28 h-20 rounded-xl overflow-hidden bg-navy-900 border-2 border-dashed border-navy-600 hover:border-accent-500 cursor-pointer transition-colors shrink-0 flex items-center justify-center group"
          >
            {imagePreview ? (
              <Image src={imagePreview} alt="Preview" fill className="object-cover" />
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-600 group-hover:text-accent-500 transition-colors" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-navy-700 hover:bg-navy-600 rounded-lg transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload image
            </button>
            <input
              type="text"
              value={form.cover_image_url}
              onChange={(e) => { update('cover_image_url', e.target.value); setImagePreview(e.target.value); }}
              className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-white placeholder-slate-600 focus:border-accent-500 focus:outline-none transition-colors text-xs"
              placeholder="…or paste image URL"
            />
          </div>
        </div>
      </div>

      {/* Video */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Video (optional)</label>
        <div className="space-y-2">
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-navy-700 hover:bg-navy-600 rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload video file
          </button>
          <input
            type="text"
            value={form.video_url}
            onChange={(e) => update('video_url', e.target.value)}
            className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-white placeholder-slate-600 focus:border-accent-500 focus:outline-none transition-colors text-xs"
            placeholder="…or paste YouTube / Vimeo URL"
          />
          {form.video_url && (
            <button
              type="button"
              onClick={() => update('video_url', '')}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" /> Remove video
            </button>
          )}
        </div>
      </div>

      {/* Publish date */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Publish Date</label>
        <input
          type="datetime-local"
          value={form.published_at}
          onChange={(e) => update('published_at', e.target.value)}
          className="w-full px-4 py-2.5 bg-navy-900 border border-navy-600 rounded-xl text-white focus:border-accent-500 focus:outline-none transition-colors text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-navy-700 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {article ? 'Save Changes' : 'Publish Article'}
        </button>
      </div>
    </form>
  );
}
