-- Public notes — the content every visitor sees in the Notes app.
--
-- This is content, not schema, which is why it lives here and not in
-- supabase/migrations. It is safe to re-run: ids are fixed and each row upserts
-- on the primary key, so editing the prose below and running the file again
-- republishes it without duplicating rows or resetting created_at.
--
-- Pushing a change to main runs this automatically (.github/workflows/publish-notes.yml).
-- To run it by hand, use a privileged connection: the Supabase dashboard SQL
-- editor, psql, or the Supabase MCP. RLS blocks public rows from the browser
-- (allow_all_users_insert_private_notes has `with check (public = false)`).
--
-- Field notes:
--   slug        `about-me` and `quick-links` are pinned by default in
--               components/apps/notes/sidebar.tsx and are the two slugs the app
--               falls back to. Keep them. Everything else groups under category.
--   category    must be a key in the `labels` map in sidebar.tsx
--               (today | yesterday | 7 | 30 | older). Public notes keep this
--               value forever — the date buckets are only recalculated for
--               private notes — so `older` is the honest permanent home.
--   created_at  sorts notes inside a group, so it sets sidebar order and decides
--               which note opens by default (getTopmostNoteSlug). about-me is
--               newest on purpose. Note the app shows a synthetic display date
--               for public notes (lib/notes/display-created-at.ts); this column
--               controls ordering, not what the reader sees.
--   session_id  null keeps these read-only: canEdit is sessionId === session_id.
--   content     GitHub-flavored markdown, rendered by react-markdown.

begin;

insert into public.notes (id, slug, title, emoji, category, public, session_id, created_at, content)
values (
  '22fdb750-7de9-4196-b40b-9ef14d5cd07b',
  'about-me',
  'about me',
  '📍',
  'older',
  true,
  null,
  '2026-08-13T18:00:00Z',
  $md$My name is Adam Smith-Kipnis and I'm an AI-native product design leader based
in Seattle. I build and manage teams creating products and experiences for
emerging technologies. I'm currently seeking product design management or IC
roles where I can own 0-1 AI product development end-to-end, from research and
strategy to shipped experience.

My work spans healthcare chatbots reaching 2.6 million patients, Fortune 1000
voice and SMS agents, and 0-1 AI product development across agentic workflows
and conversational interfaces in heavily regulated industries.

I thrive on solving hard problems: designing systems where the technology is
still being invented, the users are skeptical, and the stakes are real. That's
been true whether I was building the first audio experiences for Kinect (35
million sold), designing hybrid LLM/intent architectures for a health system, or
shaping AI agents for enterprise sales.

I earned my MBA from the University of Washington, and double majored in Music
Technology and Social Science as an undergrad at The Evergreen State College.$md$
)
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, emoji = excluded.emoji,
  category = excluded.category, public = excluded.public,
  session_id = excluded.session_id, content = excluded.content;

insert into public.notes (id, slug, title, emoji, category, public, session_id, created_at, content)
values (
  '5f1b51cd-68fe-4b8d-91d4-68100bcb47e4',
  'quick-links',
  'quick links',
  '📎',
  'older',
  true,
  null,
  '2026-08-13T17:00:00Z',
  $md$- **email** — [adam@smithkipnis.com](mailto:adam@smithkipnis.com)
- [twitter/x](https://x.com/AdamSmithKipnis) — I post here occasionally
- [bluesky](https://bsky.app/profile/adamsk.bsky.social) — I post here
  occasionally, but also run a couple of bots in different accounts that
  facilitate games I've made
- [github](https://github.com/adamsmithkipnis) — the github for my personal
  projects
- [linkedin](https://www.linkedin.com/in/AdamSmithKipnis) — where you can see
  what I've done in my career, and what colleagues, managers, and employees have
  said about me
- [instagram](https://www.instagram.com/adamsmithkipnis/) — family photos and
  hobbies
- [resume](/preview?file=%2FUsers%2Fadamsmithkipnis%2FDesktop%2FAdam%20Smith-Kipnis%20-%20Resume.pdf)
  — opens in Preview, or take the
  [PDF](/documents/Adam%20Smith-Kipnis%20-%20Resume.pdf)$md$
)
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, emoji = excluded.emoji,
  category = excluded.category, public = excluded.public,
  session_id = excluded.session_id, content = excluded.content;

insert into public.notes (id, slug, title, emoji, category, public, session_id, created_at, content)
values (
  'dbfa24cd-9a29-4ce0-aecc-3f9e6d217c39',
  'shipped-products',
  'shipped products',
  '🚢',
  'older',
  true,
  null,
  '2026-09-02T18:00:00Z',
  $md$Throughout my career I've worked on more products that haven't shipped, or only
shipped internally, than products that have shipped publicly. Thankfully, I'm
proud of my contributions to these.

- Invoca Voice Agent system (and agents)
- Invoca SMS Agent system (and agents)
- Staris AI
- Providence SSO (Single Sign-on)
- Providence Grace
- Providence & Swedish mobile apps (iOS & Android)
- Wells Fargo's Fargo AI Agent
- Samsung Family Hub Fridge
- Samsung Home Hub
- Gear IconX
- Samsung Fridge
- Samsung Gear Fit
- Wilson X Basketball & mobile app (iOS & Android)
- Kinect Star Wars
- Kinect Sparkler
- Bobblehead
- Kinect Me
- Googly Eyes
- Build A Buddy
- Kinect Adventures
- Guild Wars 2
- MAG: Massive Action Game
- Socom 5
- Destroy All Humans: Path of the Furon
- Evil Dead: Regeneration (Xbox, PlayStation 2, PC)$md$
)
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, emoji = excluded.emoji,
  category = excluded.category, public = excluded.public,
  session_id = excluded.session_id, content = excluded.content;

insert into public.notes (id, slug, title, emoji, category, public, session_id, created_at, content)
values (
  'eb21be3f-3735-4f82-aeec-3ef32bc8bf64',
  'what-i-stand-for',
  'what i stand for',
  '🥋',
  'older',
  true,
  null,
  '2026-09-02T17:00:00Z',
  $md$Here's what I stand for.

- Using logic to make decisions.
- Removing boundaries between disciplines.
- Enabling people to reach their personal best.
- Learning through "see one, do one, teach one."
- Defining the future through technological innovation.$md$
)
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, emoji = excluded.emoji,
  category = excluded.category, public = excluded.public,
  session_id = excluded.session_id, content = excluded.content;

insert into public.notes (id, slug, title, emoji, category, public, session_id, created_at, content)
values (
  '9dc8a1a1-f6e0-4e44-b359-1c43d3f79a11',
  'how-i-hire',
  'how i hire',
  '🫵',
  'older',
  true,
  null,
  '2026-09-02T16:00:00Z',
  $md$There are three core things I look for from a candidate when making a hiring
decision.

1. Can they do the job?
2. Will they love the job?
3. Will they get along with the team?

Everything outside of that is about the needs of the business.$md$
)
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, emoji = excluded.emoji,
  category = excluded.category, public = excluded.public,
  session_id = excluded.session_id, content = excluded.content;

insert into public.notes (id, slug, title, emoji, category, public, session_id, created_at, content)
values (
  'f152f8ab-52e4-4bd6-be2d-7ae8a2623835',
  'listening',
  'listening',
  '🎧',
  'older',
  true,
  null,
  '2026-09-02T15:00:00Z',
  $md$Recently I've been listening to a lot of Fred again.. His set in Mexico had great
energy, and I was inspired by his live collaboration with Thomas Bangalter of
Daft Punk.

The UNKLESounds project by James Lavelle, Richard File, and DJ Shadow still
remains my favorite DJ set of all time. The variety of music, sounds, and mixing
styles blows my mind to this day.

Nicolas Jaar's essential mix on the BBC was unlike any other essential mix. It
really pushed the boundaries of creating an emotional journey through electronic
music and sounds from around the world.

Paul Kalkbrenner is who I listen to to get in the zone and focus. As an artist he
has also accomplished a great deal, starring in a movie he composed the
soundtrack for.

### concerts

This year I've gotten to see a couple of amazing shows: YUNGBLUD and Jesse
Welles. Coincidentally, they both played Ozzy Osbourne covers live.$md$
)
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, emoji = excluded.emoji,
  category = excluded.category, public = excluded.public,
  session_id = excluded.session_id, content = excluded.content;

insert into public.notes (id, slug, title, emoji, category, public, session_id, created_at, content)
values (
  '3600082b-8d15-4ab3-b8c4-aefae6ecc2a6',
  'reverse-engineering-food',
  'reverse engineering food',
  '👨‍🍳',
  'older',
  true,
  null,
  '2026-09-02T14:00:00Z',
  $md$Great meals inspire me. One thing I like to do is reverse engineer dishes I've
truly enjoyed. In doing so I can keep reliving that same great experience, even
if the restaurant shuts down or changes its menu. Here are the ones I'm working
on these days.

- **Cafe Presse** (Seattle) — oeuf plats jambon fromage
- **Eggs 'n Things** (Honolulu) — Cajun-style blackened ahi with eggs & rice
- **Cole's** (Los Angeles) — atomic mustard$md$
)
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, emoji = excluded.emoji,
  category = excluded.category, public = excluded.public,
  session_id = excluded.session_id, content = excluded.content;

insert into public.notes (id, slug, title, emoji, category, public, session_id, created_at, content)
values (
  '5af5bcd7-e960-4009-9313-1bfac03721ea',
  'how-this-works',
  'how this works',
  '⚙️',
  'older',
  true,
  null,
  '2026-09-02T13:00:00Z',
  $md$This website is a simulation of macOS, built on an
[open-source project](https://github.com/alanagoyal/alanagoyal) from Alana
Goyal. When I discovered it I started modifying the code, personalizing it and
extending it with new apps like Safari and Spotify. Working in this codebase was
like reading a really interesting book, or modifying a car — deeply evaluating
the design and architecture choices while recreating and changing experiences. I
learned a lot from it. The foundational technologies come from companies making
a big impact: Braintrust, Supabase, and Vercel.

The top three things that were most fun about building this page:

- Reflecting on my own core values, habits, and interests, and externalizing
  those.
- Learning more about how to build creatively with the various services this is
  built on, and especially building chatbots that simulate conversations with
  people.
- Changing my perspective by paying closer attention to the interaction design
  details of macOS and other apps, and representing them accurately, or changing
  them intentionally.$md$
)
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, emoji = excluded.emoji,
  category = excluded.category, public = excluded.public,
  session_id = excluded.session_id, content = excluded.content;

commit;
