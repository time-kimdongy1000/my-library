-- Pages Remain: anonymous comments with author/admin password deletion
-- Run this entire file in Supabase Dashboard > SQL Editor.
-- Set the administrator password separately after this script succeeds.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  book_id text not null check (char_length(trim(book_id)) between 1 and 120),
  visitor_id uuid not null,
  nickname text not null check (char_length(trim(nickname)) between 2 and 20),
  body text not null check (char_length(trim(body)) between 2 and 500),
  password_hash text not null,
  language text not null check (language in ('ko', 'ja', 'en')),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists private.comment_admin_settings (
  setting_key text primary key check (setting_key = 'master_password'),
  password_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists private.comment_delete_attempts (
  id bigint generated always as identity primary key,
  comment_id bigint not null references public.comments (id) on delete cascade,
  visitor_id uuid not null,
  succeeded boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index if not exists comments_book_created_idx
  on public.comments (book_id, created_at desc)
  where is_hidden = false;

create index if not exists comments_visitor_created_idx
  on public.comments (visitor_id, created_at desc);

create index if not exists comments_created_idx
  on public.comments (created_at desc);

create index if not exists comment_delete_attempts_visitor_idx
  on private.comment_delete_attempts (visitor_id, attempted_at desc)
  where succeeded = false;

create index if not exists comment_delete_attempts_comment_idx
  on private.comment_delete_attempts (comment_id, attempted_at desc)
  where succeeded = false;

alter table public.comments enable row level security;

create or replace function public.get_comments(p_book_id text)
returns table (
  id bigint,
  nickname text,
  body text,
  language text,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = ''
as $$
  select c.id, c.nickname, c.body, c.language, c.created_at
  from public.comments as c
  where c.book_id = trim(p_book_id)
    and c.is_hidden = false
  order by c.created_at asc, c.id asc;
$$;

create or replace function public.create_comment(
  p_book_id text,
  p_visitor_id uuid,
  p_nickname text,
  p_body text,
  p_password text,
  p_language text
)
returns table (
  id bigint,
  nickname text,
  body text,
  language text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_book_id text := trim(p_book_id);
  v_nickname text := trim(p_nickname);
  v_body text := trim(p_body);
  v_comment_id bigint;
begin
  if char_length(v_book_id) not between 1 and 120 then
    raise exception using errcode = 'P0001', message = 'INVALID_BOOK_ID';
  end if;

  if p_visitor_id is null then
    raise exception using errcode = 'P0001', message = 'INVALID_VISITOR';
  end if;

  if char_length(v_nickname) not between 2 and 20 then
    raise exception using errcode = 'P0001', message = 'INVALID_NICKNAME';
  end if;

  if char_length(v_body) not between 2 and 500 then
    raise exception using errcode = 'P0001', message = 'INVALID_BODY';
  end if;

  if octet_length(p_password) not between 4 and 72 then
    raise exception using errcode = 'P0001', message = 'INVALID_PASSWORD';
  end if;

  if p_language not in ('ko', 'ja', 'en') then
    raise exception using errcode = 'P0001', message = 'INVALID_LANGUAGE';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(90441102);

  if exists (
    select 1
    from public.comments as recent
    where recent.visitor_id = p_visitor_id
      and recent.created_at > now() - interval '30 seconds'
  ) then
    raise exception using errcode = 'P0001', message = 'COMMENT_RATE_LIMIT';
  end if;

  if (
    select count(*)
    from public.comments as daily_by_visitor
    where daily_by_visitor.visitor_id = p_visitor_id
      and daily_by_visitor.created_at > now() - interval '24 hours'
  ) >= 10 then
    raise exception using errcode = 'P0001', message = 'COMMENT_DAILY_LIMIT';
  end if;

  if (
    select count(*)
    from public.comments as recent_global
    where recent_global.created_at > now() - interval '1 minute'
  ) >= 30 or (
    select count(*)
    from public.comments as daily_global
    where daily_global.created_at > now() - interval '24 hours'
  ) >= 500 then
    raise exception using errcode = 'P0001', message = 'COMMENT_GLOBAL_LIMIT';
  end if;

  if exists (
    select 1
    from public.comments as duplicate
    where duplicate.book_id = v_book_id
      and pg_catalog.lower(duplicate.body) = pg_catalog.lower(v_body)
      and duplicate.created_at > now() - interval '10 minutes'
  ) then
    raise exception using errcode = 'P0001', message = 'COMMENT_DUPLICATE';
  end if;

  insert into public.comments as inserted (
    book_id,
    visitor_id,
    nickname,
    body,
    password_hash,
    language
  ) values (
    v_book_id,
    p_visitor_id,
    v_nickname,
    v_body,
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
    p_language
  )
  returning inserted.id into v_comment_id;

  return query
    select c.id, c.nickname, c.body, c.language, c.created_at
    from public.comments as c
    where c.id = v_comment_id;
end;
$$;

drop function if exists public.delete_comment(bigint, text);

create or replace function public.delete_comment(
  p_comment_id bigint,
  p_password text,
  p_visitor_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comment_hash text;
  v_admin_hash text;
begin
  if p_visitor_id is null or octet_length(p_password) not between 1 and 72 then
    return false;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(90441103);

  select c.password_hash
  into v_comment_hash
  from public.comments as c
  where c.id = p_comment_id
    and c.is_hidden = false;

  if v_comment_hash is null then
    return false;
  end if;

  if (
    select count(*)
    from private.comment_delete_attempts as visitor_attempt
    where visitor_attempt.visitor_id = p_visitor_id
      and visitor_attempt.succeeded = false
      and visitor_attempt.attempted_at > now() - interval '10 minutes'
  ) >= 5 or (
    select count(*)
    from private.comment_delete_attempts as comment_attempt
    where comment_attempt.comment_id = p_comment_id
      and comment_attempt.succeeded = false
      and comment_attempt.attempted_at > now() - interval '10 minutes'
  ) >= 20 then
    raise exception using errcode = 'P0001', message = 'DELETE_RATE_LIMIT';
  end if;

  select settings.password_hash
  into v_admin_hash
  from private.comment_admin_settings as settings
  where settings.setting_key = 'master_password';

  if extensions.crypt(p_password, v_comment_hash) = v_comment_hash
    or (
      v_admin_hash is not null
      and extensions.crypt(p_password, v_admin_hash) = v_admin_hash
    ) then
    update public.comments as target
    set is_hidden = true
    where target.id = p_comment_id;

    insert into private.comment_delete_attempts (comment_id, visitor_id, succeeded)
    values (p_comment_id, p_visitor_id, true);

    return true;
  end if;

  insert into private.comment_delete_attempts (comment_id, visitor_id, succeeded)
  values (p_comment_id, p_visitor_id, false);

  return false;
end;
$$;

create or replace function private.set_comment_admin_password(p_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if octet_length(p_password) not between 12 and 72 then
    raise exception using errcode = 'P0001', message = 'ADMIN_PASSWORD_MUST_BE_12_TO_72_BYTES';
  end if;

  insert into private.comment_admin_settings (setting_key, password_hash, updated_at)
  values (
    'master_password',
    extensions.crypt(p_password, extensions.gen_salt('bf', 12)),
    now()
  )
  on conflict (setting_key) do update
  set password_hash = excluded.password_hash,
      updated_at = excluded.updated_at;
end;
$$;

revoke all on schema private from public, anon, authenticated;
revoke all on table public.comments from anon, authenticated;
revoke all on table private.comment_admin_settings from public, anon, authenticated;
revoke all on table private.comment_delete_attempts from public, anon, authenticated;

revoke execute on function public.get_comments(text) from public, anon, authenticated;
revoke execute on function public.create_comment(text, uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.delete_comment(bigint, text, uuid) from public, anon, authenticated;
revoke execute on function private.set_comment_admin_password(text) from public, anon, authenticated;

grant execute on function public.get_comments(text) to anon, authenticated;
grant execute on function public.create_comment(text, uuid, text, text, text, text) to anon, authenticated;
grant execute on function public.delete_comment(bigint, text, uuid) to anon, authenticated;

-- After this file succeeds, choose a private master password and run the line below
-- in a new SQL Editor query. Do not save the query as a shared snippet.
-- select private.set_comment_admin_password('replace-with-your-private-password');
