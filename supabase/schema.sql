-- Pages Remain: visitor statistics foundation
-- Run this entire file in Supabase Dashboard > SQL Editor after the project is ready.

create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  visited_on date not null default ((now() at time zone 'Asia/Seoul')::date),
  created_at timestamptz not null default now(),
  unique (visitor_id, visited_on)
);

create table if not exists public.book_views (
  id bigint generated always as identity primary key,
  book_id text not null check (char_length(book_id) between 1 and 120),
  visitor_id uuid not null,
  viewed_on date not null default ((now() at time zone 'Asia/Seoul')::date),
  created_at timestamptz not null default now(),
  unique (book_id, visitor_id, viewed_on)
);

create index if not exists book_views_book_id_idx on public.book_views (book_id);
create index if not exists book_views_viewed_on_idx on public.book_views (viewed_on);

-- Keep daily uniqueness aligned with the site's Korean calendar day.
alter table public.site_visits
  alter column visited_on set default ((now() at time zone 'Asia/Seoul')::date);
alter table public.book_views
  alter column viewed_on set default ((now() at time zone 'Asia/Seoul')::date);

alter table public.site_visits enable row level security;
alter table public.book_views enable row level security;

create or replace function public.record_site_visit(p_visitor_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.site_visits (visitor_id)
  values (p_visitor_id)
  on conflict (visitor_id, visited_on) do nothing;
end;
$$;

create or replace function public.record_book_view(p_book_id text, p_visitor_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.book_views (book_id, visitor_id)
  values (trim(p_book_id), p_visitor_id)
  on conflict (book_id, visitor_id, viewed_on) do nothing;
end;
$$;

create or replace function public.get_book_view_count(p_book_id text)
returns bigint
language sql
security definer
stable
set search_path = public
as $$
  select count(*) from public.book_views where book_id = trim(p_book_id);
$$;

create or replace function public.get_site_visitor_count()
returns bigint
language sql
security definer
stable
set search_path = public
as $$
  select count(distinct visitor_id) from public.site_visits;
$$;

revoke all on public.site_visits from anon, authenticated;
revoke all on public.book_views from anon, authenticated;
grant execute on function public.record_site_visit(uuid) to anon, authenticated;
grant execute on function public.record_book_view(text, uuid) to anon, authenticated;
grant execute on function public.get_book_view_count(text) to anon, authenticated;
grant execute on function public.get_site_visitor_count() to anon, authenticated;
