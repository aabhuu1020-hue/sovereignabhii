-- SOVEREIGNABHII Phase 1: featured content, tags, and safe public attachment reads.
-- Additive migration: existing content and private bucket remain intact.

alter table public.content_items
  add column if not exists featured boolean not null default false,
  add column if not exists tags text[] not null default '{}';

create index if not exists content_items_featured_public_idx
on public.content_items(featured, created_at desc)
where status = 'Published' and visibility = 'Public';

-- Admins can inspect files in the private bucket.
drop policy if exists "Admins read files" on storage.objects;
create policy "Admins read files"
on storage.objects for select to authenticated
using (bucket_id = 'sovereignabhii-files' and public.is_admin());

-- Public visitors can obtain signed URLs only for attachments belonging to
-- content that is currently Published and Public. Draft/private files stay protected.
drop policy if exists "Public read published attachments" on storage.objects;
create policy "Public read published attachments"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'sovereignabhii-files'
  and exists (
    select 1
    from public.content_items as content
    where content.attachment_path = storage.objects.name
      and content.status = 'Published'
      and content.visibility = 'Public'
  )
);
