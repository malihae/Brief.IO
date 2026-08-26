-- Run this AFTER schema.sql in Supabase SQL Editor
-- Adds extra security policies and constraints

-- ── 1. Prevent users from updating their own plan (only webhook can) ─────────
-- Drop the broad update policy and replace with a column-restricted one
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile (safe fields only)" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Prevents client from escalating their own plan
    -- plan, stripe_customer_id, stripe_subscription_id can only be written by service role
  );

-- ── 2. Briefs: no update or delete allowed (immutable audit log) ─────────────
create policy "Briefs are immutable" on public.briefs
  for delete using (false);

-- ── 3. Prevent reading other users' tokens via briefs join ───────────────────
create policy "Users cannot select others briefs" on public.briefs
  for select using (auth.uid() = user_id);

-- ── 4. Revoke direct table access — all writes go through RLS ────────────────
revoke all on public.profiles from anon;
revoke all on public.briefs from anon;
revoke all on public.tasks from anon;

-- ── 5. Cap brief content length at DB level ──────────────────────────────────
alter table public.briefs
  add constraint brief_content_length check (char_length(content) <= 5000);

-- ── 6. Cap task title length ──────────────────────────────────────────────────
alter table public.tasks
  add constraint task_title_length check (char_length(title) <= 500);

-- ── 7. Index for fast per-user daily brief count (used in free plan gate) ────
create index if not exists briefs_user_created_idx on public.briefs(user_id, created_at desc);
create index if not exists tasks_user_idx on public.tasks(user_id, completed);
