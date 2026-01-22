// server.js
import express from "express";
import fetch from "node-fetch"; // keep if you're using node-fetch; Node 18+ also has global fetch

const app = express();
const PORT = process.env.PORT || 3000;

// Simple in-memory cache with TTL
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map(); // key -> { value, expires }

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value, ttl = CACHE_TTL_MS) {
  cache.set(key, { value, expires: Date.now() + ttl });
}

// Helper to fetch and parse JSON safely with headers
async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    // return raw text if JSON parse fails
    data = { raw: text };
  }

  return { ok: res.ok, status: res.status, data, text };
}

app.get("/roblox/game/:placeId", async (req, res) => {
  try {
    const placeId = Number(req.params.placeId);
    if (!placeId) {
      return res.status(400).json({ error: "Invalid Place ID" });
    }

    // serve from cache if available
    const cached = getCached(placeId);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // 1) Convert placeId -> universeId using the stable GET endpoint (with headers)
    const uniUrl = `https://apis.roblox.com/universes/v1/places/${placeId}/universe`;
    const uniResp = await fetchJson(uniUrl);

    // debug log for easier troubleshooting in Render logs
    console.log(`[UNIVERSE] ${placeId} -> status ${uniResp.status}`);

    if (!uniResp.ok || !uniResp.data || typeof uniResp.data.universeId === "undefined") {
      return res.status(400).json({
        error: "Failed to fetch universeId",
        status: uniResp.status,
        response: uniResp.data ?? uniResp.text
      });
    }

    const universeId = uniResp.data.universeId;

    // 2) Fetch icon + media concurrently (give headers too)
    const iconUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=png`;
    const mediaUrl = `https://games.roblox.com/v2/games/${universeId}/media`;

    const [iconResp, mediaResp] = await Promise.all([
      fetchJson(iconUrl),
      fetchJson(mediaUrl)
    ]);

    // Build response fields safely
    const icon = iconResp.ok && Array.isArray(iconResp.data?.data) && iconResp.data.data[0]?.imageUrl
      ? iconResp.data.data[0].imageUrl
      : null;

    const thumbnails = mediaResp.ok && Array.isArray(mediaResp.data?.data)
      ? mediaResp.data.data
      : (mediaResp.data ?? []);

    const out = {
      placeId,
      universeId,
      icon,
      thumbnails
    };

    // cache result
    setCached(placeId, out);

    return res.json(out);

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
});

// Health endpoint (useful for Render)
app.get("/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
