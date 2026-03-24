import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_OG_META_URL =
  "https://vfjmwbxvticnwfmvoonc.supabase.co/functions/v1/og-meta";

const BOT_PATTERNS = [
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "whatsapp",
  "linkedinbot",
  "telegrambot",
  "slackbot",
  "discordbot",
  "googlebot",
  "bingbot",
  "applebot",
  "pinterest",
  "vkshare",
  "w3c_validator",
  "ia_archiver",
  "redditbot",
  "rogerbot",
  "showyoubot",
  "outbrain",
  "quora link preview",
];

function isSocialBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BOT_PATTERNS.some((p) => lower.includes(p));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const productId = Array.isArray(id) ? id[0] : id;
  const userAgent = req.headers["user-agent"] ?? "";

  // If it's a social media bot, serve the OG meta HTML
  if (isSocialBot(userAgent) && productId) {
    try {
      const ogUrl = `${SUPABASE_OG_META_URL}?id=${encodeURIComponent(productId)}`;
      const ogResponse = await fetch(ogUrl);
      const html = await ogResponse.text();

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader(
        "Cache-Control",
        "public, s-maxage=300, stale-while-revalidate=60"
      );
      return res.status(ogResponse.status).send(html);
    } catch (err) {
      console.error("OG meta proxy error:", err);
      // Fall through to SPA on error
    }
  }

  // Regular user — serve the SPA (index.html)
  try {
    const indexPath = join(process.cwd(), "dist", "index.html");
    const html = readFileSync(indexPath, "utf-8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch {
    // Last resort
    return res.redirect(302, "/");
  }
}
