export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  video_url: string | null;
  slug: string;
  published_at: string;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  logo_url: string | null;
  updated_at: string;
}
