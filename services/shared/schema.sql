-- Example tables (run in Supabase SQL editor)
create table if not exists watchlists (
  id uuid default gen_random_uuid() primary key,
  fid bigint not null,
  project text not null,
  created_at timestamptz default now()
);

create table if not exists project_insights (
  id uuid default gen_random_uuid() primary key,
  project text not null,
  text text,
  created_at timestamptz default now()
);

create table if not exists generated_posts (
  id uuid default gen_random_uuid() primary key,
  project text not null,
  text text,
  rank int,
  created_at timestamptz default now()
);
