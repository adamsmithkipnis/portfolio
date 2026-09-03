import assert from "node:assert/strict";
import test from "node:test";
import {
  formatDuration,
  formatTotalDuration,
  isValidTrackUri,
  trackIdFromUri,
  totalPlaylistDuration,
  findPlaylistById,
} from "../lib/spotify/format";
import { SPOTIFY_AUDIOBOOKS, SPOTIFY_PLAYLISTS } from "../lib/spotify/data";

test("formatDuration renders mm:ss with a padded seconds field", () => {
  assert.equal(formatDuration(254453), "4:14");
  assert.equal(formatDuration(5000), "0:05");
  assert.equal(formatDuration(60000), "1:00");
});

test("formatDuration collapses invalid input rather than rendering NaN", () => {
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(-1), "0:00");
  assert.equal(formatDuration(Number.NaN), "0:00");
});

test("formatTotalDuration switches between minute and hour forms", () => {
  assert.equal(formatTotalDuration(720000), "12 min");
  assert.equal(formatTotalDuration(3600000), "1 hr");
  assert.equal(formatTotalDuration(4320000), "1 hr 12 min");
  assert.equal(formatTotalDuration(0), "0 min");
});

test("track uris are validated against Spotify's 22-character base62 id", () => {
  assert.equal(isValidTrackUri("spotify:track:1lbXEepatjRVjoG8pZMtdp"), true);
  assert.equal(isValidTrackUri("spotify:track:tooshort"), false);
  assert.equal(isValidTrackUri("spotify:playlist:1lbXEepatjRVjoG8pZMtdp"), false);
  assert.equal(isValidTrackUri("https://open.spotify.com/track/1lbXEepatjRVjoG8pZMtdp"), false);
});

test("trackIdFromUri extracts the id and rejects malformed uris", () => {
  assert.equal(trackIdFromUri("spotify:track:1lbXEepatjRVjoG8pZMtdp"), "1lbXEepatjRVjoG8pZMtdp");
  assert.equal(trackIdFromUri("spotify:track:nope"), null);
});

test("totalPlaylistDuration ignores non-finite durations", () => {
  assert.equal(
    totalPlaylistDuration([
      { durationMs: 1000 },
      { durationMs: Number.NaN },
      { durationMs: 2000 },
    ]),
    3000
  );
});

test("findPlaylistById returns null for unknown and empty ids", () => {
  assert.equal(findPlaylistById(SPOTIFY_PLAYLISTS, null), null);
  assert.equal(findPlaylistById(SPOTIFY_PLAYLISTS, "does-not-exist"), null);
});

// The realistic failure mode is a bad regeneration of data.ts, so assert the
// shape the UI and the embed controller depend on.
test("generated playlist data is well formed", () => {
  assert.ok(SPOTIFY_PLAYLISTS.length > 0, "expected at least one playlist");

  for (const playlist of SPOTIFY_PLAYLISTS) {
    assert.ok(playlist.id.length > 0, "playlist id must not be empty");
    assert.ok(playlist.name.length > 0, `playlist ${playlist.id} needs a name`);
    assert.ok(playlist.tracks.length > 0, `playlist ${playlist.name} has no tracks`);

    for (const track of playlist.tracks) {
      assert.ok(
        isValidTrackUri(track.uri),
        `${playlist.name}: "${track.name}" has a malformed uri: ${track.uri}`
      );
      assert.equal(trackIdFromUri(track.uri), track.id, `${track.name}: id/uri mismatch`);
      assert.ok(track.name.length > 0, `${playlist.name} has a track with no name`);
      assert.ok(track.artists.length > 0, `${track.name} has no artist`);
      assert.ok(track.durationMs > 0, `${track.name} has a non-positive duration`);
      assert.ok(
        track.externalUrl.startsWith("https://open.spotify.com/"),
        `${track.name} needs a link back to Spotify`
      );
    }
  }
});

// Audiobooks are stored at book level: Spotify only embeds the show, so there
// is deliberately no chapter list to validate.
test("generated audiobook data is well formed", () => {
  assert.ok(SPOTIFY_AUDIOBOOKS.length > 0, "expected at least one audiobook");

  for (const book of SPOTIFY_AUDIOBOOKS) {
    assert.ok(book.id.length > 0, "audiobook id must not be empty");
    assert.ok(book.name.length > 0, `audiobook ${book.id} needs a name`);
    assert.match(
      book.uri,
      /^spotify:show:[A-Za-z0-9]{22}$/,
      `${book.name} has a malformed show uri: ${book.uri}`
    );
    assert.ok(book.coverArt.length > 0, `${book.name} has no cover art`);
    assert.ok(book.totalChapters > 0, `${book.name} reports no chapters`);
    assert.ok(
      book.externalUrl.startsWith("https://open.spotify.com/"),
      `${book.name} needs a link back to Spotify`
    );
  }
});

test("audiobook author and narrator are parsed out of the description", () => {
  // Spotify puts these in the description; the fetch script splits them off, so
  // a format change on their side should fail loudly here rather than silently
  // leaving every book unattributed.
  const missingAuthor = SPOTIFY_AUDIOBOOKS.filter((b) => !b.author);
  assert.deepEqual(
    missingAuthor.map((b) => b.name),
    [],
    "every audiobook should have an author parsed from its description"
  );

  for (const book of SPOTIFY_AUDIOBOOKS) {
    assert.ok(
      !book.description.includes("Author(s):"),
      `${book.name} still has the Author(s) prefix in its blurb`
    );
  }
});

test("playlists and audiobooks do not share ids", () => {
  const playlistIds = new Set(SPOTIFY_PLAYLISTS.map((p) => p.id));
  const clash = SPOTIFY_AUDIOBOOKS.filter((b) => playlistIds.has(b.id));
  assert.deepEqual(
    clash.map((b) => b.name),
    [],
    "a shared id would make the selected-item lookup ambiguous"
  );
});
