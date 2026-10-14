import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validate, consentLines } from '../sdk/validate.mjs';
import { createKino } from '../sdk/kino-shim.mjs';
import { validateManifest, checkOutput } from '../sdk/contract.mjs';
import * as plugin from '../plugin.js';
const root = new URL('../', import.meta.url).pathname;
const catalog = JSON.parse(readFileSync(new URL('../catalog.json', import.meta.url), 'utf8'));
const fixtures = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'));
const firstCode = catalog.episodes[0].videoCode;
const manifest = validateManifest(readFileSync(new URL('../kino-plugin.json', import.meta.url), 'utf8')).manifest;
const SHARE = 'https://megankiddifference.com/' + firstCode;
const FUTURE = 'https://next-voe.example.com/' + firstCode;
const NEXT = 'https://another-voe.example.com/' + firstCode;

function futurePlayer({ permission = true, targets = [FUTURE], http = false, player = fixtures.player, nativeError, firstStatus = 200 } = {}) {
  const requests = [], attempts = [];
  const fetchImpl = async (url, options) => {
    const current = String(url); requests.push({ url: current, options });
    const step = requests.length - 1;
    assert.ok(requests.length <= 3);
    if (step === 0 && firstStatus !== 200) return new Response('', { status: firstStatus });
    if (step < targets.length) return http
      ? new Response('', { status: 302, headers: { Location: targets[step] } })
      : new Response('<script>window.location.href=' + JSON.stringify(targets[step]) + ';</script>');
    return new Response(player);
  };
  // Native API 9 approval is modeled only for these two synthetic fixture hosts.
  // The legacy shim does not implement Kino's real general grant or its quotas.
  const { kino, servers } = createKino(permission ? { ...manifest,
    hosts: [...manifest.hosts, 'next-voe.example.com', 'another-voe.example.com'] } : manifest, { fetchImpl });
  globalThis.kino = { ...kino, fetchAnyHost: permission, fetch: async (url, options) => {
    attempts.push({ url: String(url), options });
    if (nativeError && String(url) === FUTURE) throw Object.assign(new Error('synthetic native gate error'), { code: nativeError });
    return kino.fetch(url, options);
  } };
  return { requests, attempts, servers };
}
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
    assert.ok(calls.length <= 3, 'resolve must not follow unbounded redirects');
    assert.ok(['https://voe.sx/' + firstCode, 'https://megankiddifference.com/' + firstCode].includes(address));
    return new Response(calls.length === 1 ? start : page, { status: 200 });
  } };
}
test('manifest and exports are accepted by Kino', async () => {
  const result = await validate(root);
  assert.deepEqual(result.problems, []);
});

test('general HTTPS permission is explicit and needs Kino 0.9.55+', async () => {
  const result = await validate(root);
  assert.equal(manifest.apiVersion, 9);
  assert.equal(manifest.fetchHosts, 'any');
  assert.ok(consentLines(manifest).some((line) => line.danger
    && line.text === 'Puede conectarse a cualquier servidor público de internet (solo https, nunca tu red local)'));
  assert.ok(result.notes.some((note) => note.includes('Kino 0.9.55')));
  assert.ok(!result.notes.some((note) => note.includes('fetchHosts') && note.includes('se ignora')));
});

for (const http of [false, true]) {
  test('an approved new domain resolves the same episode through ' + (http ? 'HTTP' : 'JavaScript'), async () => {
    const r = futurePlayer({ http });
    const s = await plugin.resolve('bump:1:1');
    assert.deepEqual(checkOutput('resolve', s, manifest, r.servers).drops, []);
    assert.equal(s.headers.Referer, FUTURE);
    assert.equal(s.subtitles[0].url, 'https://next-voe.example.com/captions/episode_es.srt');
    assert.ok(!manifest.hosts.includes('next-voe.example.com'));
    assert.deepEqual(r.requests.map((x) => x.url), [SHARE, FUTURE]);
    assert.ok(r.attempts.every((x) => x.options.redirect === 'manual' && x.options.cookies === false));
  });
}

for (const permission of [false, undefined]) {
  test('an unapproved or absent native grant refuses a new domain: ' + permission, async () => {
    const r = futurePlayer({ permission: false }); globalThis.kino.fetchAnyHost = permission;
    await assert.rejects(plugin.resolve('bump:1:1'), { code: 'unavailable' });
    assert.deepEqual(r.requests.map((x) => x.url), [SHARE]);
  });
}

for (const target of ['http://next-voe.example.com/' + firstCode, 'https://next-voe.example.com:8443/' + firstCode,
  'https://127.0.0.1/' + firstCode, 'https://router.local/' + firstCode,
  'https://next-voe.example.com/zzzzzzzzzzzz', FUTURE + '?ad=1', FUTURE + '#ad']) {
  test('even the general grant rejects a different video or unsafe navigation: ' + target, async () => {
    const r = futurePlayer({ targets: [target], http: true });
    await assert.rejects(plugin.resolve('bump:1:1'), { code: 'unavailable' });
    assert.equal(r.requests.length, 1);
  });
}

test('two mirror navigations stay within the three-page limit', async () => {
  const r = futurePlayer({ targets: [FUTURE, NEXT] });
  assert.equal((await plugin.resolve('bump:1:1')).headers.Referer, NEXT);
  assert.equal(r.requests.length, 3);
});

test('a cycle never repeats a request', async () => {
  const r = futurePlayer({ targets: [FUTURE, SHARE] });
  await assert.rejects(plugin.resolve('bump:1:1'), { code: 'unavailable' });
  assert.deepEqual(r.requests.map((x) => x.url), [SHARE, FUTURE]);
});

test('a fourth page is never fetched', async () => {
  const r = futurePlayer({ targets: [FUTURE, NEXT, 'https://final-voe.example.com/' + firstCode] });
  await assert.rejects(plugin.resolve('bump:1:1'), { code: 'unavailable' });
  assert.equal(r.requests.length, 3);
});

test('a new-domain verification page is not retried', async () => {
  const r = futurePlayer({ player: '<h1>Verify you are human</h1>' });
  await assert.rejects(plugin.resolve('bump:1:1'), { code: 'unavailable' });
  assert.equal(r.requests.length, 2);
});

test('native request quotas preserve the rate_limited error', async () => {
  const r = futurePlayer({ nativeError: 'rate_limited' });
  await assert.rejects(plugin.resolve('bump:1:1'), { code: 'rate_limited' });
  assert.equal(r.requests.length, 1);
});

test('native refusal is respected even after the general grant was approved', async () => {
  const r = futurePlayer({ nativeError: 'host_not_allowed' });
  await assert.rejects(plugin.resolve('bump:1:1'), { code: 'unavailable' });
  assert.equal(r.requests.length, 1);
});

test('a resolved new player domain is reused without storing an expiring media URL', async () => {
  futurePlayer();
  await plugin.resolve('bump:1:1');
  assert.equal(kino.storage.get('voe-player-host-v1'), 'next-voe.example.com');
  const calls = [];
  kino.fetch = async (url) => {
    calls.push(String(url));
    return { ok: true, status: 200, headers: {}, text: () => fixtures.player };
  };
  assert.equal((await plugin.resolve('bump:1:1')).headers.Referer, FUTURE);
  assert.deepEqual(calls, [FUTURE]);
});

test('a cached new domain is ignored when the general permission is no longer active', async () => {
  const r = futurePlayer({ permission: false, targets: [] });
  kino.storage.set('voe-player-host-v1', 'next-voe.example.com');
  await plugin.resolve('bump:1:1');
  assert.deepEqual(r.requests.map((x) => x.url), [SHARE]);
});

test('a retired direct mirror falls back once to the stable share URL', async () => {
  const r = futurePlayer({ firstStatus: 404, targets: [] });
  const s = await plugin.resolve('bump:1:1');
  assert.equal(s.headers.Referer, 'https://voe.sx/' + firstCode);
  assert.deepEqual(r.requests.map((x) => x.url), [SHARE, 'https://voe.sx/' + firstCode]);
});

test('navigation never receives a fresh time budget when the deadline has elapsed', async () => {
  const original = Date.now, start = original();
  try {
    Date.now = () => start;
    const r = futurePlayer();
    const fetch = kino.fetch;
    kino.fetch = async (url, options) => {
      const response = await fetch(url, options);
      Date.now = () => start + 17000;
      return response;
    };
    await assert.rejects(plugin.resolve('bump:1:1'), { code: 'unavailable' });
    assert.equal(r.requests.length, 1);
  } finally { Date.now = original; }
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
  assert.equal(stream.headers.Referer, 'https://megankiddifference.com/' + firstCode);
  assert.equal(stream.subtitles.length, 1);
  assert.equal(stream.subtitles[0].lang, 'es');
  assert.equal(stream.subtitles[0].url, 'https://megankiddifference.com/captions/episode_es.srt');
  assert.equal(stream.subtitles[0].format, 'srt');
});
for (const [name,html] of [
  ['captcha', '<h1>Verify you are human</h1>'],
  ['unrecognized format', '<div>Loading player</div>'],
  ['unapproved host', "<script>window.location.href='https://other.example.com/" + firstCode + "';</script>"],
  ['different video', "<script>window.location.href='https://megankiddifference.com/zzzzzzzzzzzz';</script>"],
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
