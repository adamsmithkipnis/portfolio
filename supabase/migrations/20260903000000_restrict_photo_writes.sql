-- Close the public write path to photos.
--
-- The original migration left inserts open and noted they were "controlled via
-- API key at endpoint level". That holds only if the endpoint is the sole way in,
-- and it is not: NEXT_PUBLIC_SUPABASE_ANON_KEY ships in the browser bundle by
-- design, so anyone can read it off the deployed site and write to Supabase
-- directly, never touching app/api/photos/upload and never seeing
-- PHOTOS_UPLOAD_API_KEY.
--
-- In practice that meant a stranger could push 10MB files into a public storage
-- bucket on this project, as often as they liked.
--
-- Uploads are unaffected: the route authenticates with SUPABASE_SERVICE_ROLE_KEY,
-- which bypasses RLS. Reads are unaffected: the browser only calls select_photos,
-- and the bucket stays public so images keep loading.

-- 1. Table inserts: service_role only
drop policy if exists "allow_insert_photos" on "public"."photos";
revoke insert on table "public"."photos" from "anon";
revoke insert on table "public"."photos" from "authenticated";

-- 2. Storage uploads: service_role only.
--    The read policy and the public bucket flag are deliberately left alone.
drop policy if exists "Allow uploads to photos bucket" on storage.objects;

-- 3. The insert_photo RPC is SECURITY DEFINER, so it runs as its owner and
--    ignores both the grants above and RLS. Postgres grants EXECUTE to PUBLIC by
--    default, which left it callable with the anon key — a second way in that
--    revoking the table grant alone would not have closed.
revoke execute on function public.insert_photo(text, text, timestamp with time zone, text[]) from public;
revoke execute on function public.insert_photo(text, text, timestamp with time zone, text[]) from anon;
revoke execute on function public.insert_photo(text, text, timestamp with time zone, text[]) from authenticated;

-- select_photos stays callable: it is read-only and the gallery depends on it.
