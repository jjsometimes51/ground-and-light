# Ground & Light — Personal Blog

A minimal independent personal blog with:

- Own domain support through Vercel
- Frontend built with Next.js
- Admin CMS at `/admin`
- Sanity backend for posts and site settings
- Categories: Travel, Notes, Work, Musings, About
- Upload and display text, images, audio, and video

## 1. Install

```bash
npm install
```

## 2. Create Sanity project

Create a Sanity project and dataset, then copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-05-12
```

## 3. Run locally

```bash
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## 4. Deploy

Push to GitHub, import the repo into Vercel, and add the same environment variables in Vercel.

Then connect your own domain in Vercel Project Settings → Domains.

## Admin content model

### Post

Each post supports:

- Title
- Slug
- Category: Travel / Notes / Work / Musings
- Excerpt
- Cover image
- Audio file
- Video file
- Body with rich text, inline images, and files
- Publish date

### Site Settings

Editable:

- Site title
- Tagline
- About text

## Suggested first tagline

> Abide nowhere. Let the mind flow freely.

## Suggested first post title

> Ground & Light
