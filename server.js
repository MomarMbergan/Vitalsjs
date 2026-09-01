const express = require('express');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
const app = express();
const REMOTE = 'https://sscweb.gsfc.nasa.gov/WS/sscr/2/application.wadl';
const CACHE_TTL_MS = parseInt(process.env.WADL_CACHE_TTL_MS || '60000', 10); // default 60s
let cache = { data: null, fetchedAt: 0 };

app.get('/wadl', async (req, res) => {
  const force = req.query.force === '1' || req.query.force === 'true';
  const now = Date.now();
  if(!force && cache.data && (now - cache.fetchedAt) < CACHE_TTL_MS){
    res.set('Content-Type', 'application/xml');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('X-Cache', 'HIT');
    return res.send(cache.data);
  }
  try {
    const r = await fetch(REMOTE);
    const txt = await r.text();
    cache.data = txt;
    cache.fetchedAt = Date.now();
    res.set('Content-Type', 'application/xml');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('X-Cache', 'MISS');
    res.send(txt);
  } catch (err) {
    res.status(502).send('Proxy error: ' + err.message);
  }
});

// health
app.get('/health', (req, res) => {
  res.json({ ok: true, cachedAt: cache.fetchedAt || null, ttlMs: CACHE_TTL_MS });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`WADL proxy listening on http://localhost:${port}/wadl (TTL=${CACHE_TTL_MS}ms)`));
