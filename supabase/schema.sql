create extension if not exists pgcrypto;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin',
    false
  );
$$;

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  type text not null check (
    type in ('Book', 'Quote', 'Article', 'Poetry', 'Photo', 'Folder')
  ),
  category text not null default '',
  status text not null default 'Draft'
    check (status in ('Draft', 'Published')),
  visibility text not null default 'Private'
    check (visibility in ('Public', 'Private')),
  attachment_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_public_idx
on public.content_items(status, visibility, type);

alter table public.content_items enable row level security;

drop policy if exists "Public can read published content"
on public.content_items;

create policy "Public can read published content"
on public.content_items
for select
to anon, authenticated
using (
  (status = 'Published' and visibility = 'Public')
  or public.is_admin()
);

drop policy if exists "Admins can insert content"
on public.content_items;

create policy "Admins can insert content"
on public.content_items
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update content"
on public.content_items;

create policy "Admins can update content"
on public.content_items
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete content"
on public.content_items;

create policy "Admins can delete content"
on public.content_items
for delete
to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('sovereignabhii-files', 'sovereignabhii-files', false)
on conflict (id) do nothing;

drop policy if exists "Admins upload files"
on storage.objects;

create policy "Admins upload files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'sovereignabhii-files'
  and public.is_admin()
);

drop policy if exists "Admins update files"
on storage.objects;

create policy "Admins update files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'sovereignabhii-files'
  and public.is_admin()
)
with check (
  bucket_id = 'sovereignabhii-files'
  and public.is_admin()
);

drop policy if exists "Admins delete files"
on storage.objects;

create policy "Admins delete files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'sovereignabhii-files'
  and public.is_admin()
);
