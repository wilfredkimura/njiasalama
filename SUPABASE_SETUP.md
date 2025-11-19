# Supabase Setup Guide

Follow these steps to set up your Supabase backend for Njia Salama.

## 1. Create a Supabase Project

1.  Go to [supabase.com](https://supabase.com) and sign in.
2.  Click "New Project".
3.  Choose your organization, give your project a name (e.g., "Njia Salama"), and set a strong database password.
4.  Select a region close to your users.
5.  Click "Create new project".

## 2. Get API Keys

1.  Once your project is ready, go to **Project Settings** (cog icon) > **API**.
2.  Copy the `Project URL` and `anon` public key.
3.  Update your `.env` file (and Vercel environment variables) with these values:

```env
PUBLIC_SUPABASE_URL=your_project_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 3. Database Setup (SQL)

Go to the **SQL Editor** in your Supabase dashboard and run the following script to create the table and set up security policies.

```sql
-- Create the hazards table
create table public.hazards (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  hazard_type text not null,
  description text null,
  location geometry(point, 4326) null, -- PostGIS geometry type
  severity_rating integer null default 1,
  created_by uuid references auth.users not null default auth.uid(), -- Links to the user who created it
  constraint hazards_pkey primary key (id),
  constraint hazards_severity_rating_check check (
    (
      (severity_rating >= 1)
      and (severity_rating <= 5)
    )
  )
);

-- Enable Row Level Security (RLS)
alter table public.hazards enable row level security;

-- Policy: Allow anyone to read hazards (public access)
create policy "Enable read access for all users" on public.hazards
  for select using (true);

-- Policy: Allow authenticated users to insert their own hazards
create policy "Enable insert for authenticated users only" on public.hazards
  for insert with check (auth.uid() = created_by);

-- Policy: Allow users to update their own hazards
create policy "Enable update for users based on user_id" on public.hazards
  for update using (auth.uid() = created_by);

-- Policy: Allow users to delete their own hazards
create policy "Enable delete for users based on user_id" on public.hazards
  for delete using (auth.uid() = created_by);

-- Create an index for spatial queries (optional but recommended for performance)
create index hazards_geo_index on public.hazards using gist (location);
```

## 4. Enable PostGIS

If the script above fails on the `geometry` type, you need to enable the PostGIS extension.
In the SQL Editor, run:

```sql
create extension if not exists postgis;
```

Then run the table creation script again.

## 5. Auth Configuration

1.  Go to **Authentication** > **Providers**.
2.  Ensure **Email** is enabled.
3.  (Optional) Disable "Confirm email" in **Authentication** > **URL Configuration** if you want users to log in immediately without email verification for testing.

## 6. Deployment on Vercel

1.  Push your code to a GitHub repository.
2.  Import the project into Vercel.
3.  In the "Environment Variables" section of the deployment setup, add:
    *   `PUBLIC_SUPABASE_URL`
    *   `PUBLIC_SUPABASE_ANON_KEY`
4.  Deploy!
