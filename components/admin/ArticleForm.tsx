'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, ImageIcon, PlayCircle } from 'lucide-react';
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
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [inlineVideoUrl, setInlineVideoUrl] = useState('');
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkSelection, setLinkSelection] = useState({ start: 0, end: 0 });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const inlineImageRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [form, setForm] = useState({
    title: article?.title ?? '',
    author: article?.author ?? '',
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

  function insertAtCursor(tag: string) {
    const textarea = contentRef.current;
    if (!textarea) {
      update('content', form.content + '\n' + tag + '\n');
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = form.content.substring(0, start);
    const after = form.content.substring(end);
    const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
    const newContent = before + prefix + tag + '\n' + after;
    update('content', newContent);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + prefix.length + tag.length + 1;
      textarea.focus();
    }, 0);
  }

  function wrapSelection(prefix: string, suffix: string, placeholder: string) {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.content.substring(start, end) || placeholder;
    const before = form.content.substring(0, start);
    const after = form.content.substring(end);
    const newContent = before + prefix + selected + suffix + after;
    update('content', newContent);
    setTimeout(() => {
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = start + prefix.length + selected.length;
      textarea.focus();
    }, 0);
  }

  function prefixCurrentLine(linePrefix: string) {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const content = form.content;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const currentLine = content.substring(lineStart);
    const lineEnd = currentLine.indexOf('\n');
    const lineText = lineEnd === -1 ? currentLine : currentLine.substring(0, lineEnd);
    const strippedLine = lineText.replace(/^(#{2,3} )/, '');
    const newLine = lineText.startsWith(linePrefix) ? strippedLine : linePrefix + strippedLine;
    const before = content.substring(0, lineStart);
    const after = content.substring(lineStart + lineText.length);
    update('content', before + newLine + after);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + (newLine.length - lineText.length);
      textarea.focus();
    }, 0);
  }

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

  async function handleInlineImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadFile(file, 'article-images');
      insertAtCursor(`[image: ${url} | Add your caption here]`);
    } catch {
      setError('Image upload failed.');
    } finally {
      setLoading(false);
      if (inlineImageRef.current) inlineImageRef.current.value = '';
    }
  }

  function handleOpenLinkPanel() {
    const textarea = contentRef.current;
    if (textarea) {
      setLinkSelection({ start: textarea.selectionStart, end: textarea.selectionEnd });
    }
    setShowLinkPanel(true);
    setShowVideoPanel(false);
  }

  function handleLinkInsert() {
    if (!linkUrl.trim()) return;
    const textarea = contentRef.current;
    if (!textarea) return;
    const { start, end } = linkSelection;
    const selectedText = form.content.substring(start, end) || 'link text';
    const tag = `[${selectedText}](${linkUrl.trim()})`;
    const before = form.content.substring(0, start);
    const after = form.content.substring(end);
    update('content', before + tag + after);
    setLinkUrl('');
    setShowLinkPanel(false);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + tag.length;
      textarea.focus();
    }, 0);
  }

  function handleInlineVideoInsert() {
    if (!inlineVideoUrl.trim()) return;
    insertAtCursor(`[video: ${inlineVideoUrl.trim()} | Add your caption here]`);
    setInlineVideoUrl('');
    setShowVideoPanel(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setLoading(true);
    setError('');

    const payload = {
      title: form.title.trim(),
      author: form.author.trim() || null,
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

      {/* Author */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Author</label>
        <input
          type="text"
          value={form.author}
          onChange={(e) => update('author', e.target.value)}
          className="w-full px-4 py-2.5 bg-navy-900 border border-navy-600 rounded-xl text-white placeholder-slate-600 focus:border-accent-500 focus:outline-none transition-colors text-sm"
          placeholder="e.g. Mihai Marian"
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

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs text-slate-500">Format:</span>
          <button
            type="button"
            onClick={() => prefixCurrentLine('## ')}
            className="px-2.5 py-1.5 text-xs font-bold text-slate-300 bg-navy-700 hover:bg-navy-600 rounded-lg transition-colors"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => prefixCurrentLine('### ')}
            className="px-2.5 py-1.5 text-xs font-bold text-slate-300 bg-navy-700 hover:bg-navy-600 rounded-lg transition-colors"
            title="Heading 3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('**', '**', 'bold text')}
            className="px-2.5 py-1.5 text-xs font-bold text-slate-300 bg-navy-700 hover:bg-navy-600 rounded-lg transition-colors"
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('*', '*', 'italic text')}
            className="px-2.5 py-1.5 text-xs font-italic text-slate-300 bg-navy-700 hover:bg-navy-600 rounded-lg transition-colors italic"
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={handleOpenLinkPanel}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-navy-700 hover:bg-navy-600 rounded-lg transition-colors underline"
            title="Link"
          >
            URL
          </button>
          <span className="text-xs text-slate-600">|</span>
          <span className="text-xs text-slate-500">Insert:</span>
          <input
            ref={inlineImageRef}
            type="file"
            accept="image/*"
            onChange={handleInlineImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inlineImageRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-navy-700 hover:bg-navy-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Image
          </button>
          <button
            type="button"
            onClick={() => setShowVideoPanel(!showVideoPanel)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-navy-700 hover:bg-navy-600 rounded-lg transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Video
          </button>
        </div>

        {/* Link panel */}
        {showLinkPanel && (
          <div className="mb-2 p-3 bg-navy-900 border border-navy-600 rounded-xl space-y-2">
            <p className="text-xs text-slate-400">Paste the URL for the link:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLinkInsert(); } }}
                className="flex-1 px-3 py-2 bg-navy-800 border border-navy-600 rounded-lg text-white placeholder-slate-600 focus:border-accent-500 focus:outline-none text-xs"
                placeholder="https://..."
                autoFocus
              />
              <button
                type="button"
                onClick={handleLinkInsert}
                className="px-3 py-2 bg-accent-500 hover:bg-accent-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Insert
              </button>
              <button
                type="button"
                onClick={() => setShowLinkPanel(false)}
                className="px-3 py-2 text-slate-400 hover:text-white text-xs rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-slate-500">Select text first to use it as the link label, or it will insert "link text" as placeholder.</p>
          </div>
        )}

        {/* Inline video panel */}
        {showVideoPanel && (
          <div className="mb-2 p-3 bg-navy-900 border border-navy-600 rounded-xl space-y-2">
            <p className="text-xs text-slate-400">Paste a YouTube embed URL or any video URL:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inlineVideoUrl}
                onChange={(e) => setInlineVideoUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-navy-800 border border-navy-600 rounded-lg text-white placeholder-slate-600 focus:border-accent-500 focus:outline-none text-xs"
                placeholder="https://www.youtube.com/embed/..."
              />
              <button
                type="button"
                onClick={handleInlineVideoInsert}
                className="px-3 py-2 bg-accent-500 hover:bg-accent-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Insert
              </button>
            </div>
            <p className="text-xs text-slate-500">
              YouTube: click Share → Embed → copy only the URL inside src="..."
            </p>
          </div>
        )}

        <textarea
          ref={contentRef}
          value={form.content}
          onChange={(e) => update('content', e.target.value)}
          rows={10}
          className="w-full px-4 py-2.5 bg-navy-900 border border-navy-600 rounded-xl text-white placeholder-slate-600 focus:border-accent-500 focus:outline-none transition-colors text-sm resize-y font-mono"
          placeholder="Write your article content here… Use the Insert buttons above to add images or videos with captions."
        />
        <p className="text-xs text-slate-600 mt-1">
          After inserting, replace "Add your caption here" with your actual caption text.
        </p>
      </div>

      {/* Cover image */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Cover Image</label>
        <div className="flex items-start gap-4">
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




