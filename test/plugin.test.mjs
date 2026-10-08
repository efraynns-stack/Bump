import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validate } from '../sdk/validate.mjs';
const root = new URL('../', import.meta.url).pathname;
const catalog = JSON.parse(readFileSync(new URL('../catalog.json', import.meta.url), 'utf8'));
const fixtures = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'));
const firstCode = catalog.episodes[0].videoCode;
async function checked(run, args = [], extra = {}) {
  const result = await validate(root, { run, args, ...extra });
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.drops, []);
  return result.output;
}
function playerFetch(page, start = page) {
  const calls = [];
  return { calls, fetchImpl: async (url) => {
    const address = String(url);
    calls.push(address);
    assert.ok(calls.length <= 2, 'resolve must not follow unbounded redirects');
    assert.ok(['https://voe.sx/' + firstCode, 'https://teresapoliticallearn.com/' + firstCode].includes(address));
    return new Response(calls.length === 1 ? start : page, { status: 200 });
  } };
}
test('manifest and exports are accepted by Kino', async () => {
  const result = await validate(root);
  assert.deepEqual(result.problems, []);
});
test('five seasons are complete, ordered and uniquely mapped with metadata', async () => {
  const result = await checked('episodes', ['bump-2021']);
  assert.equal(result.episodes.length, 50);
  assert.equal(new Set(catalog.episodes.map(e => e.videoCode)).size, 50);
  assert.equal(new Set(result.episodes.map(e => e.ref)).size, 50);
  assert.equal(catalog.episodes.filter(e => !e.stillFallback).length, 22);
  for (let i = 0; i < 50; i++) {
    const e = result.episodes[i], source = catalog.episodes[i];
    assert.equal(e.season, Math.floor(i / 10) + 1);
    assert.equal(e.number, i % 10 + 1);
    assert.equal(e.ref, 'bump:' + e.season + ':' + e.number);
    assert.ok(e.title && e.overview && e.still);
    assert.ok(source.metadataUrl.endsWith('s' + String(e.season).padStart(2,'0') + 'e' + String(e.number).padStart(2,'0')));
  }
});
test('Home, browse and search open the same stable series', async () => {
  const rows = await checked('home'), page = await checked('browse', [rows[0].ref]);
  const found = await checked('search', ['Bump (2021)']);
  assert.equal(rows[0].items[0].ref, 'bump-2021');
  assert.deepEqual(page.items, found.items);
  assert.equal(found.items.length, 1);
  assert.equal((await checked('search', ['otra serie'])).items.length, 0);
});
test('public VOE player resolves HLS and relative Spanish subtitles in one request', async () => {
  const mock = playerFetch(fixtures.player);
  const stream = await checked('resolve', ['bump:1:1'], mock);
  assert.equal(mock.calls.length, 1);
  assert.equal(stream.url, 'https://media.example.com/bump/master.m3u8');
  assert.equal(stream.mime, 'application/vnd.apple.mpegurl');
  assert.equal(stream.headers.Referer, 'https://teresapoliticallearn.com/' + firstCode);
  assert.equal(stream.subtitles.length, 1);
  assert.equal(stream.subtitles[0].lang, 'es');
  assert.equal(stream.subtitles[0].url, 'https://teresapoliticallearn.com/captions/episode_es.srt');
  assert.equal(stream.subtitles[0].format, 'srt');
});
for (const [name,html] of [
  ['captcha', '<h1>Verify you are human</h1>'],
  ['unrecognized format', '<div>Loading player</div>'],
  ['unapproved host', "<script>window.location.href='https://other.example.com/" + firstCode + "';</script>"],
  ['different video', "<script>window.location.href='https://teresapoliticallearn.com/zzzzzzzzzzzz';</script>"],
]) {
  test('stops on ' + name + ' without requesting more pages', async () => {
    const mock = playerFetch(html, html);
    const result = await validate(root, { run:'resolve', args:['bump:1:1'], ...mock });
    assert.ok(result.problems.length);
    assert.equal(mock.calls.length, 1);
  });
}
test('missing Christmas special fails before making any network request', async () => {
  const result = await validate(root, { run:'resolve', args:['bump:4:11'], fetchImpl: async () => assert.fail('no fetch for missing episode') });
  assert.ok(result.problems.length);
});
test('HTTP 429 ends playback resolution immediately', async () => {
  let calls = 0;
  const result = await validate(root, { run:'resolve', args:['bump:1:1'], fetchImpl:async () => {
    calls++; return new Response('Too many requests', { status:429 });
  } });
  assert.ok(result.problems.length);
  assert.equal(calls, 1);
});
