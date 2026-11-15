-- À exécuter dans Supabase > SQL Editor, une seule fois.
-- Table personnelle : une ligne JSON par utilisateur, accessible seulement au propriétaire.
create table if not exists public.studyspace_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.studyspace_data enable row level security;
grant select, insert, update, delete on public.studyspace_data to authenticated;
drop policy if exists "studyspace_own_select" on public.studyspace_data;
drop policy if exists "studyspace_own_insert" on public.studyspace_data;
drop policy if exists "studyspace_own_update" on public.studyspace_data;
create policy "studyspace_own_select" on public.studyspace_data for select to authenticated using ((select auth.uid()) = user_id);
create policy "studyspace_own_insert" on public.studyspace_data for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "studyspace_own_update" on public.studyspace_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- Bucket de fichiers PRIVE. Ne pas rendre public.
insert into storage.buckets (id,name,public,file_size_limit) values ('studyspace-files','studyspace-files',false,52428800)
on conflict (id) do update set public=false;
-- Tous les chemins sont de la forme <uid>/<document-id>.
drop policy if exists "studyspace_files_select" on storage.objects;
drop policy if exists "studyspace_files_insert" on storage.objects;
drop policy if exists "studyspace_files_update" on storage.objects;
drop policy if exists "studyspace_files_delete" on storage.objects;
create policy "studyspace_files_select" on storage.objects for select to authenticated
using (bucket_id='studyspace-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "studyspace_files_insert" on storage.objects for insert to authenticated
with check (bucket_id='studyspace-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "studyspace_files_update" on storage.objects for update to authenticated
using (bucket_id='studyspace-files' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='studyspace-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "studyspace_files_delete" on storage.objects for delete to authenticated
using (bucket_id='studyspace-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
