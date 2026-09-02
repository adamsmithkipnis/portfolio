#!/usr/bin/env node
/**
 * Regenerates `lib/spotify/data.ts` from live Spotify playlists.
 *
 * This is a DEV-TIME script. It is deliberately not wired into predev/prebuild:
 * it needs credentials, and the whole point of baking the data is that
 * production never holds a Spotify secret.
 *
 * Auth: tries the client-credentials flow first. Spotify's docs now describe
 * playlist reads as requiring a user token, so if that is rejected the script
 * falls back to a one-time Authorization Code flow against your own account and
 * caches a refresh token in .env.local (gitignored).
 *
 * Usage:
 *   npm run spotify:fetch
 *
 * Requires in .env.local:
 *   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
 * Register the app at https://developer.spotify.com/dashboard with redirect URI
 *   http://127.0.0.1:8888/callback
 */

import { createServer } from "node:http";
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Configure the playlists to include, in the order they should appear.
// Accepts a bare id, a spotify: URI, or an open.spotify.com URL.
// ---------------------------------------------------------------------------
const PLAYLISTS = [
  "https://open.spotify.com/playlist/3Xx6Rw0wnsBkXLOApUNWM9",
  "https://open.spotify.com/playlist/0NG9SPYqcqLDqNgESCJhLs",
  "https://open.spotify.com/playlist/6h9X5RLuHl877a1N1SLox1",
  "https://open.spotify.com/playlist/5P7T0iKh7qO4Fdvh6ko0sW",
  "https://open.spotify.com/playlist/4bScjAZD4W2UGaNVbNHgdQ",
  "https://open.spotify.com/playlist/3cai0SGQQ03gcvaEB4VMYw",
  "https://open.spotify.com/playlist/1cKu6eH7jmqwlKjW1Nxcdf",
  "https://open.spotify.com/playlist/1d6JclfbtbBzJtC1DIghkU",
];

const ROOT = process.cwd();
const ENV_PATH = join(ROOT, ".env.local");
const OUT_PATH = join(ROOT, "lib/spotify/data.ts");
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const SCOPES = "playlist-read-private playlist-read-collaborative";

// ---------------------------------------------------------------------------
// env
// ---------------------------------------------------------------------------

function loadEnv() {
  if (!existsSync(ENV_PATH)) return {};
  const out = {};
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    out[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = { ...loadEnv(), ...process.env };
const CLIENT_ID = env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = env.SPOTIFY_CLIENT_SECRET;

function basicAuth() {
  return Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
}

// ---------------------------------------------------------------------------
// auth
// ---------------------------------------------------------------------------

async function tokenRequest(body) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });
  if (!res.ok) {
    throw new Error(`token request failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function getClientCredentialsToken() {
  const json = await tokenRequest({ grant_type: "client_credentials" });
  return json.access_token;
}

async function getUserTokenFromRefresh(refreshToken) {
  const json = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return json.access_token;
}

/** One-time interactive consent. Spins a loopback server, prints a URL. */
async function runAuthorizationCodeFlow() {
  const state = randomBytes(16).toString("hex");
  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      state,
    });

  console.log("\nOpen this URL in a browser and approve access:\n");
  console.log(`  ${authUrl}\n`);

  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, REDIRECT_URI);
      if (url.pathname !== "/callback") {
        res.writeHead(404).end();
        return;
      }
      const returnedState = url.searchParams.get("state");
      const returnedCode = url.searchParams.get("code");
      const returnedError = url.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html" });

      if (returnedError) {
        res.end(`<p>Spotify returned: ${returnedError}. You can close this tab.</p>`);
        // Only abort if this error belongs to the current attempt.
        if (returnedState === state) {
          server.close();
          reject(new Error(`Spotify denied the request: ${returnedError}`));
        } else {
          console.log(`  (ignored a stale error callback: ${returnedError})`);
        }
        return;
      }

      // A stale tab reloading an older callback URL must not kill this run:
      // answer it, keep listening for the callback that matches this attempt.
      if (returnedState !== state) {
        res.end(
          "<p>This is an old authorization link, so it was ignored. " +
            "Use the newest URL printed in the terminal.</p>"
        );
        console.log("  (ignored a stale callback from an earlier run)");
        return;
      }

      if (!returnedCode) {
        res.end("<p>Authorization failed. You can close this tab.</p>");
        server.close();
        reject(new Error("callback arrived with no authorization code"));
        return;
      }
      res.end("<p>Authorized. You can close this tab.</p>");
      server.close();
      resolve(returnedCode);
    });
    server.listen(8888, "127.0.0.1");
    setTimeout(() => {
      server.close();
      reject(
        new Error(
          "timed out waiting for authorization. Re-run to get a fresh URL. If " +
            "Spotify showed INVALID_CLIENT, add http://127.0.0.1:8888/callback " +
            "to the app's Redirect URIs in the developer dashboard first."
        )
      );
    }, 900_000);
  });

  const json = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  });

  if (json.refresh_token) {
    appendFileSync(ENV_PATH, `\nSPOTIFY_REFRESH_TOKEN="${json.refresh_token}"\n`);
    console.log("Cached SPOTIFY_REFRESH_TOKEN in .env.local for future runs.");
  }
  return json.access_token;
}

// ---------------------------------------------------------------------------
// api
// ---------------------------------------------------------------------------

async function api(path, token) {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = new Error(`GET ${path} → ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

function parsePlaylistId(input) {
  const trimmed = input.trim();
  const uriMatch = trimmed.match(/^spotify:playlist:([A-Za-z0-9]+)$/);
  if (uriMatch) return uriMatch[1];
  const urlMatch = trimmed.match(/playlist\/([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  return trimmed;
}

/**
 * Playlist items were renamed /tracks → /items in the Feb 2026 Web API
 * revision. Try the current name, fall back to the legacy one.
 */
async function fetchPlaylistItems(playlistId, token) {
  const collected = [];
  for (const endpoint of ["items", "tracks"]) {
    try {
      let next = `/playlists/${playlistId}/${endpoint}?limit=50`;
      while (next) {
        const page = await api(next.replace("https://api.spotify.com/v1", ""), token);
        collected.push(...(page.items ?? []));
        next = page.next;
      }
      return collected;
    } catch (error) {
      // 404 = endpoint name not in this API version, 403 = deprecated and
      // forbidden for this app. Either way, try the other name. A 401 is a
      // genuine auth failure and must surface.
      if (error.status === 404 || error.status === 403) continue;
      throw error;
    }
  }
  throw new Error(`could not read items for playlist ${playlistId}`);
}

function normalizeTrack(entry) {
  // The Feb 2026 Web API revision renamed the playlist entry's payload from
  // `track` to `item` (and `track` is now a boolean flag on that payload).
  // Accept both so this keeps working either way.
  const track = entry?.item ?? entry?.track;
  if (!track || typeof track !== "object") return null;
  if (track.type !== "track" || !track.id) return null;
  return {
    id: track.id,
    uri: track.uri,
    name: track.name,
    artists: (track.artists ?? []).map((a) => a.name).join(", "),
    album: track.album?.name ?? "",
    albumArt: track.album?.images?.[0]?.url ?? "",
    durationMs: track.duration_ms ?? 0,
    explicit: Boolean(track.explicit),
    addedAt: entry.added_at ?? "",
    externalUrl: track.external_urls?.spotify ?? `https://open.spotify.com/track/${track.id}`,
  };
}

async function fetchPlaylist(rawId, token) {
  const id = parsePlaylistId(rawId);
  const playlist = await api(`/playlists/${id}`, token);
  const items = await fetchPlaylistItems(id, token);
  const tracks = items.map(normalizeTrack).filter(Boolean);

  console.log(`  ${playlist.name} — ${tracks.length} tracks`);

  return {
    id: playlist.id,
    uri: playlist.uri ?? `spotify:playlist:${playlist.id}`,
    name: playlist.name ?? "",
    description: playlist.description ?? "",
    coverArt: playlist.images?.[0]?.url ?? tracks[0]?.albumArt ?? "",
    externalUrl:
      playlist.external_urls?.spotify ?? `https://open.spotify.com/playlist/${playlist.id}`,
    owner: playlist.owner?.display_name ?? "",
    tracks,
  };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function resolveToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env.local"
    );
  }

  if (env.SPOTIFY_REFRESH_TOKEN) {
    console.log("Using cached refresh token.");
    return getUserTokenFromRefresh(env.SPOTIFY_REFRESH_TOKEN);
  }

  const probeId = parsePlaylistId(PLAYLISTS[0]);
  const appToken = await getClientCredentialsToken();

  // Probe the ITEMS endpoint, not the playlist endpoint. As of the Feb 2026
  // Web API revision an app-only token still reads playlist metadata (name,
  // cover) but is rejected for the track list, so probing /playlists/{id}
  // would report success and then fail on the very next call.
  try {
    await api(`/playlists/${probeId}/items?limit=1`, appToken);
    console.log("Client-credentials token can read playlist items.");
    return appToken;
  } catch (error) {
    console.log(
      `Client credentials cannot read playlist items (${error.status}). ` +
        "Falling back to a one-time user authorization."
    );
    return runAuthorizationCodeFlow();
  }
}

function renderDataFile(playlists) {
  return `// GENERATED FILE — do not edit by hand.
// Regenerate with: npm run spotify:fetch
//
// Text metadata only. Audio is streamed by Spotify's embed at runtime; nothing
// here is or contains a media file.

import type { SpotifyPlaylist } from "./types";

export const SPOTIFY_PLAYLISTS: SpotifyPlaylist[] = [
${playlists.map((p) => "  " + JSON.stringify(p)).join(",\n")}
];
`;
}

async function main() {
  if (PLAYLISTS.length === 0) {
    console.error(
      "No playlists configured. Add playlist URLs to the PLAYLISTS array at the " +
        "top of scripts/fetch-spotify-playlists.mjs."
    );
    process.exit(1);
  }

  const token = await resolveToken();
  console.log("\nFetching playlists:");
  const playlists = [];
  for (const raw of PLAYLISTS) {
    playlists.push(await fetchPlaylist(raw, token));
  }

  writeFileSync(OUT_PATH, renderDataFile(playlists));
  const trackCount = playlists.reduce((n, p) => n + p.tracks.length, 0);
  console.log(`\nWrote ${OUT_PATH} — ${playlists.length} playlists, ${trackCount} tracks.`);
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
