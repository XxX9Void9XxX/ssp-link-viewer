import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  const seed = req.query.url;
  const depth = parseInt(req.query.depth) || 2;
  if (!seed) return res.status(400).send("Missing url");

  const visited = new Set();
  const queue = [{ url: seed, level: 0 }];
  const results = [];

  while (queue.length > 0) {
    const { url, level } = queue.shift();
    if (visited.has(url) || level > depth) continue;
    visited.add(url);

    try {
      const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!resp.ok) continue;
      const html = await resp.text();
      results.push(url);

      const dom = new JSDOM(html);
      const links = Array.from(dom.window.document.querySelectorAll("a[href]"))
        .map(a => new URL(a.href, url).href)
        .filter(l => !visited.has(l));

      links.forEach(l => queue.push({ url: l, level: level + 1 }));
    } catch { continue; }
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({ links: results });
}
