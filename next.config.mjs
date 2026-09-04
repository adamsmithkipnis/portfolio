/**
 * @type {import('next').NextConfig}
 *
 * Routing behavior:
 * - /                    → shows desktop with saved session state (default layout for new visitors)
 * - /notes               → on desktop: notes focused (selection resolved client-side)
 *                          on mobile: shows sidebar (no redirect)
 * - /notes/{slug}        → shows the note (notes focused)
 * - /{app}               → shows default desktop with that app focused
 * - /notes/{invalid}     → redirects to /notes/error
 * - /{note-slug}         → redirects to /notes/{note-slug} (server-side, permanent)
 * - /website             → archived smithkipnis.com (framed by the Safari app)
 * - /website/casestudies → archived case studies, same paths as the original
 * - /{other}             → 404
 */

// Extract Supabase hostname from environment variable
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;

const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage for photos
      ...(supabaseHostname ? [{
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      }] : []),
    ],
  },
  async rewrites() {
    return [
      // The archived Squarespace site, served from our own origin so the
      // Safari app can frame it — Squarespace sends X-Frame-Options:
      // SAMEORIGIN, and a subdomain would not have helped, since that check
      // is origin-based and a subdomain is a different origin.
      { source: "/website", destination: "/archive/smithkipnis/index.html" },
      // The archived case studies mirror the original's paths, so links
      // between them read the way they did on the live site.
      { source: "/website/:path*", destination: "/archive/smithkipnis/:path*/index.html" },
    ];
  },
  async redirects() {
    // Bare-slug URLs for the public notes, e.g. /listening -> /notes/listening.
    // Upstream shipped its own slugs here from before the /notes/* prefix existed;
    // these are ours. A slug belongs in this list when a note with that slug exists
    // in supabase/seed/public-notes.sql — add one here when you add one there.
    // Permanent (308) redirects, so browsers cache them.
    const noteSlugs = [
      'about-me',
      'quick-links',
      'shipped-products',
      'what-i-stand-for',
      'how-i-hire',
      'listening',
      'reverse-engineering-food',
      'how-this-works',
    ];

    return [
      // Bare slugs redirect to their note
      ...noteSlugs.map((slug) => ({
        source: `/${slug}`,
        destination: `/notes/${slug}`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
