-- Public notes — the content every visitor sees in the Notes app.
--
-- This is content, not schema, which is why it lives here and not in
-- supabase/migrations. It is safe to re-run: ids are fixed and each row upserts
-- on the primary key, so editing the prose below and running the file again
-- republishes it without duplicating rows or resetting created_at.
--
-- RLS blocks this from the browser (allow_all_users_insert_private_notes has
-- `with check (public = false)`), so run it with a privileged connection: the
-- Supabase dashboard SQL editor, `psql`, or the Supabase MCP.
--
-- Field notes:
--   slug        `about-me` and `quick-links` are pinned by default in
--               components/apps/notes/sidebar.tsx and are the two slugs the app
--               falls back to. Keep them.
--   category    must be a key in the `labels` map in sidebar.tsx
--               (today | yesterday | 7 | 30 | older). Public notes keep this
--               value forever — the date buckets are only recalculated for
--               private notes — so `older` is the honest permanent home for a
--               note that is pinned anyway.
--   created_at  sorts notes inside a group, so it decides which note opens by
--               default (getTopmostNoteSlug). about-me is newest on purpose.
--   session_id  null keeps these read-only: canEdit is sessionId === session_id.
--   content     GitHub-flavored markdown, rendered by react-markdown.

begin;

insert into public.notes (id, slug, title, emoji, category, public, session_id, created_at, content)
values (
  '22fdb750-7de9-4196-b40b-9ef14d5cd07b',
  'about-me',
  'about me',
  '👋🏼',
  'older',
  true,
  null,
  '2026-08-13T18:00:00Z',
  $md$My name is Adam Smith-Kipnis, and I'm an AI-native product design leader in
Seattle. I build and manage teams creating products and experiences for emerging
technologies.

I'm currently looking for product design management or IC roles where I can own
0→1 AI product development end to end — research and strategy through shipped
experience.

My work spans healthcare chatbots reaching 2.6 million patients, voice and SMS
agents for Fortune 1000 companies, and 0→1 development across agentic workflows
and conversational interfaces in heavily regulated industries.

I like the problems where the technology is still being invented, the users are
skeptical, and the stakes are real. That was true building the first audio
experiences for Kinect (35 million sold), designing a hybrid LLM/intent
architecture for a health system, and shaping AI agents for enterprise sales.

I earned my MBA at the University of Washington, and double majored in Music
Technology and Social Science at The Evergreen State College.

### about this site

It's a simulation of macOS. The windows drag, the dock works, and the apps are
real — open Finder for case studies, Messages to talk with AI versions of people
whose work I admire, or Terminal if that's more your speed.

Any note you write here is yours: it lives in your browser session, you can edit
it, and the link is shareable. This one is read-only.$md$
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  emoji = excluded.emoji,
  category = excluded.category,
  public = excluded.public,
  session_id = excluded.session_id,
  content = excluded.content;

insert into public.notes (id, slug, title, emoji, category, public, session_id, created_at, content)
values (
  '5f1b51cd-68fe-4b8d-91d4-68100bcb47e4',
  'quick-links',
  'quick links',
  '🔗',
  'older',
  true,
  null,
  '2026-08-13T17:00:00Z',
  $md$- [email](mailto:adam@smithkipnis.com) — the best way to reach me
- [linkedin](https://www.linkedin.com/in/AdamSmithKipnis) — what I've done in my
  career, and what colleagues have said about me
- [github](https://github.com/adamsmithkipnis) — my personal projects
- [resume](/preview?file=%2FUsers%2Fadamsmithkipnis%2FDesktop%2FAdam%20Smith-Kipnis%20-%20Resume.pdf)
  — opens in Preview, or take the
  [PDF](/documents/Adam%20Smith-Kipnis%20-%20Resume.pdf)
- [this site's source](https://github.com/adamsmithkipnis/portfolio) — fork it,
  or send a pull request$md$
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  emoji = excluded.emoji,
  category = excluded.category,
  public = excluded.public,
  session_id = excluded.session_id,
  content = excluded.content;

commit;
