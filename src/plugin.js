// Bump Kino. The VOE public-loader data reader is adapted from Toku Kino.
// No scripts from the video host are evaluated. Signed media links are never cached.
const PLAYER_HOSTS = ["voe.sx", "teresapoliticallearn.com"];

function log(step, detail) {
  try { kino.log("[bump]", step, detail); } catch { /* diagnostics never interrupt playback */ }
}

function item() { return { ...CATALOG.series, genres: [...CATALOG.series.genres] }; }

export async function home() {
  await null;
  return [{ id: "bump", ref: "bump", title: "Bump · cinco temporadas", genre: "series", items: [item()] }];
}

export async function browse(ref, cursor) {
  await null;
  if (ref !== "bump") throw kino.error("not_found", "Esta categoría no existe");
  if (cursor != null && cursor !== "") throw kino.error("not_found", "Esta categoría no tiene más páginas");
  return { items: [item()] };
}

export async function search(query) {
  await null;
  const names = [query && query.q, query && query.originalTitle]
    .concat(query && Array.isArray(query.altTitles) ? query.altTitles.slice(0, 10) : []);
  const matches = names.some((name) => typeof name === "string" &&
    /(?:^|[^a-z0-9])bump(?:$|[^a-z0-9])/i.test(name.slice(0, 500)));
  return matches ? [item()] : [];
}

export async function episodes(ref) {
  await null;
  if (ref !== "bump-2021") throw kino.error("not_found", "Esta serie no existe");
  return {
    series: {
      title: CATALOG.series.title, poster: CATALOG.series.poster, backdrop: CATALOG.series.backdrop,
      overview: CATALOG.series.overview, genres: [...CATALOG.series.genres], year: CATALOG.series.year,
    },
    episodes: CATALOG.episodes.map((e) => {
      const episode = { season: e.season, number: e.number, ref: "bump:" + e.season + ":" + e.number,
        title: e.title, still: e.still, overview: e.overview };
      if (e.airDate) episode.airDate = e.airDate;
      return episode;
    }),
  };
}

function safeHttps(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const u = new URL(value.startsWith("//") ? "https:" + value : value);
    if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
    const host = u.hostname.toLowerCase();
    if (!host.includes(".") || host.includes(":") || /^\d+(?:\.\d+){3}$/.test(host)) return null;
    if (/(^|\.)(localhost|local|lan|internal|home|test|invalid)$/.test(host) || host.endsWith(".home.arpa")) return null;
    return u.href;
  } catch { return null; }
}

function playerUrl(raw, code) {
  const safe = safeHttps(raw);
  if (!safe) return null;
  const u = new URL(safe);
  return PLAYER_HOSTS.includes(u.hostname) && u.pathname === "/" + code && !u.search && !u.hash ? safe : null;
}

function checkRestriction(html) {
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  if (/verify (?:that )?you are human|security check|captcha|just a moment|verifica que eres humano/i.test(visible))
    throw kino.error("unavailable", "VOE solicita una verificación en su página");
  if (/not available in your (?:country|region)|geo.blocked/i.test(visible))
    throw kino.error("geo_blocked", "VOE no ofrece este video en tu región");
  if (/file (?:has been )?(?:deleted|removed|not found)|video (?:has been )?removed/i.test(visible))
    throw kino.error("not_found", "El video ya no está disponible en VOE");
  if (/log in to (?:watch|view)|sign in to (?:watch|view)/i.test(visible))
    throw kino.error("auth_required", "Este video requiere una sesión en VOE");
}

async function playerPage(url, code, deadline) {
  await null;
  const remaining = deadline - Date.now();
  if (remaining < 1000) throw kino.error("unavailable", "VOE tardó demasiado en responder");
  let r;
  try {
    r = await kino.fetch(url, { redirect: "manual", cookies: false,
      timeoutMs: Math.min(15000, remaining), headers: { Accept: "text/html" } });
  } catch (e) {
    log("VOE_FETCH_FAILED", e && e.code || "network");
    throw kino.error("unavailable", "No se pudo consultar el reproductor de VOE");
  }
  log("VOE_FETCH", "http=" + r.status);
  if (r.status === 429) throw kino.error("rate_limited", "VOE está limitando las consultas");
  if (r.status === 404 || r.status === 410) throw kino.error("not_found", "El video ya no está disponible en VOE");
  if (r.status >= 300 && r.status < 400) {
    let target = null;
    try { target = playerUrl(new URL(r.headers.location, url).href, code); } catch { /* malformed location */ }
    if (!target) throw kino.error("unavailable", "VOE redirigió a un reproductor no reconocido");
    return { target };
  }
  if (!r.ok) throw kino.error("unavailable", "VOE respondió con un error de acceso");
  const html = r.text();
  checkRestriction(html);
  return { html };
}

function voeConfig(html) {
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*(["'])application\/json\1[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (m[2].length > 200000) continue;
    try {
      const data = JSON.parse(m[2]);
      if (!Array.isArray(data) || typeof data[0] !== "string" || data[0].length > 150000) continue;
      let value = data[0].replace(/[a-zA-Z]/g, (c) => {
        const n = c.charCodeAt(0), base = n <= 90 ? 65 : 97;
        return String.fromCharCode(base + (n - base + 13) % 26);
      });
      for (const marker of ["@$", "^^", "~@", "%?", "*~", "!!", "#&"]) value = value.split(marker).join("");
      value = value.split("_").join("");
      value = atob(value).split("").map((c) => String.fromCharCode(c.charCodeAt(0) - 3)).reverse().join("");
      const bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
      const config = JSON.parse(new TextDecoder().decode(bytes));
      if (config && typeof config === "object" && !Array.isArray(config)) return config;
    } catch { /* A changed format fails cleanly; do not evaluate host scripts. */ }
  }
  return null;
}

function voeStream(html, referer) {
  const data = voeConfig(html);
  if (!data) return null;
  if (data.drm || data.licenseUrl) throw kino.error("unavailable", "Este video requiere un reproductor con DRM");
  const url = safeHttps(data.source);
  if (!url || !/\.m3u8(?:[?#]|$)/i.test(url)) return null;
  const stream = { url, mime: "application/vnd.apple.mpegurl", headers: { Referer: referer }, expiresInSeconds: 180 };
  const seen = new Set();
  const subtitles = (Array.isArray(data.captions) ? data.captions : []).slice(0, 40).flatMap((c) => {
    if (!c || typeof c !== "object") return [];
    let url = null;
    if (typeof c.file === "string" && c.file.length <= 2048) {
      try { url = safeHttps(new URL(c.file, referer).href); } catch { /* invalid subtitle URL */ }
    }
    if (!url || seen.has(url)) return [];
    seen.add(url);
    const code = c.language || c.srclang;
    const label = typeof c.label === "string" ? c.label.slice(0, 80) : "";
    const lang = typeof code === "string" && /^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/i.test(code)
      ? code.toLowerCase() : /Spanish|Castilian|Espa[nñ]ol/i.test(label) ? "es" : /English|Ingl[eé]s/i.test(label) ? "en" : "und";
    const path = new URL(url).pathname;
    const format = /\.srt$/i.test(path) ? "srt" : /\.vtt$/i.test(path) ? "vtt" : null;
    return [{ url, lang, ...(format ? { format } : {}) }];
  });
  if (subtitles.length) stream.subtitles = subtitles;
  return stream;
}

export async function resolve(ref) {
  await null;
  const m = typeof ref === "string" && /^bump:([1-5]):([1-9]\d?)$/.exec(ref);
  const episode = m && CATALOG.episodes.find((e) => e.season === Number(m[1]) && e.number === Number(m[2]));
  if (!episode) throw kino.error("not_found", "Este capítulo no está en el catálogo de Bump");
  const code = episode.videoCode;
  const deadline = Date.now() + 18000;
  // This is the public player host VOE navigates to for the inspected share links.
  // Opening it directly avoids spending the call's budget on the navigation page first.
  let url = "https://teresapoliticallearn.com/" + code;
  // At most one ordinary navigation, bounded below Kino's 20-second resolve limit.
  for (let step = 0; step < 2; step++) {
    const page = await playerPage(url, code, deadline);
    if (page.html) {
      const stream = voeStream(page.html, url);
      if (stream) { log("VOE_RESOLVED", "season=" + episode.season + " episode=" + episode.number); return stream; }
    }
    const navigation = page.target || (page.html &&
      (/window\.location\.href\s*=\s*(["'])(https:\/\/[^"']+)\1/.exec(page.html) || [])[2]);
    const next = playerUrl(navigation, code);
    if (!next || next === url) break;
    url = next;
  }
  throw kino.error("unavailable", "No se encontró un video público compatible en el reproductor de VOE");
}
