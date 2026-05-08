# SubLupa — Personal Blog

Modern, minimal, production-ready blog built with Next.js 14, Tailwind CSS, and Supabase.

---

## Quick Start

### 1. Install dependencies

```bash
cd sublupa
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Create database tables

Go to **Supabase → SQL Editor** and run:

```sql
-- Articles
create table articles (
  id            uuid default gen_random_uuid() primary key,
  title         text not null,
  excerpt       text not null default '',
  content       text not null default '',
  cover_image_url text,
  video_url     text,
  slug          text unique not null,
  published_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- Site settings (logo, etc.)
create table site_settings (
  id         uuid default gen_random_uuid() primary key,
  logo_url   text,
  updated_at timestamptz not null default now()
);

-- Row Level Security
alter table articles enable row level security;
alter table site_settings enable row level security;

-- Public read
create policy "Public read articles"
  on articles for select using (true);

create policy "Public read settings"
  on site_settings for select using (true);

-- Authenticated write
create policy "Auth write articles"
  on articles for all using (auth.role() = 'authenticated');

create policy "Auth write settings"
  on site_settings for all using (auth.role() = 'authenticated');
```

### 5. Create storage buckets

In **Supabase → Storage**, create three public buckets:

| Bucket name       | Public |
|-------------------|--------|
| `article-images`  | ✅     |
| `article-videos`  | ✅     |
| `logos`           | ✅     |

For each bucket, add a storage policy to allow authenticated uploads:

```sql
-- Example for article-images (repeat for article-videos and logos)
create policy "Auth upload article-images"
  on storage.objects for insert
  with check (bucket_id = 'article-images' and auth.role() = 'authenticated');
```

### 6. Create the admin user

In **Supabase → Authentication → Users**, click **Invite user** and send an invite to your email.
After accepting, you can sign in at `/admin/login`.

### 7. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
sublupa/
├── app/
│   ├── page.tsx              # Homepage (SSR)
│   ├── layout.tsx
│   ├── globals.css
│   └── admin/
│       ├── page.tsx          # Admin dashboard
│       └── login/page.tsx    # Admin login
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx              # Hero with latest article
│   ├── ArticleGrid.tsx       # 3 latest cards
│   ├── ArticleCard.tsx
│   ├── ArticleModal.tsx      # Full article overlay
│   ├── SearchModal.tsx       # Live search
│   ├── Footer.tsx
│   └── admin/
│       ├── ArticleForm.tsx   # Create / edit form
│       └── ArticleList.tsx
├── lib/
│   ├── types.ts
│   ├── utils.ts
│   └── supabase/
│       ├── client.ts         # Browser client
│       └── server.ts         # Server/SSR client
├── middleware.ts              # Auth guard for /admin
└── .env.local.example
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — done!

---

## Custom Domain

In Vercel → Domains, add your domain and follow the DNS instructions.
Update `metadataBase` in `app/layout.tsx` to your production domain.

---

## Social Links

Edit `components/Footer.tsx` and replace the `href="#"` placeholders with your real profile URLs.

---

## Color Palette

| Color | Value |
|-------|-------|
| Navy 900 (background) | `#0A1628` |
| Navy 800 (cards) | `#0F2040` |
| Accent green | `#22C55E` |
| White | `#FFFFFF` |
| Muted text | `#94A3B8` |
