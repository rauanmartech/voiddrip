import type { NextRequest } from "next/server";

// Social media crawler User-Agent patterns
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
  "microsoftofficeuseractivation",
];

function isSocialBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some((pattern) => ua.includes(pattern));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") ?? "";

  // Only intercept /produto/:id routes
  const productMatch = pathname.match(/^\/produto\/([^/]+)$/);
  if (!productMatch) {
    // Not a product page — serve SPA normally
    return new Response(null, { status: 200 });
  }

  // Regular user — serve the SPA normally
  if (!isSocialBot(userAgent)) {
    return new Response(null, { status: 200 });
  }

  // It's a bot on a product page — proxy the OG HTML
  const productId = productMatch[1];
  const ogMetaUrl = `https://vfjmwbxvticnwfmvoonc.supabase.co/functions/v1/og-meta?id=${encodeURIComponent(productId)}`;

  try {
    // Manual proxy: fetch from Supabase Edge Function and return the HTML directly
    const ogResponse = await fetch(ogMetaUrl, {
      headers: {
        "User-Agent": "Vercel-Edge-Middleware/1.0",
      },
    });

    const html = await ogResponse.text();

    return new Response(html, {
      status: ogResponse.status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        "X-OG-Served-By": "edge-middleware",
      },
    });
  } catch (err) {
    // On error, fall through to normal SPA
    console.error("og-meta proxy error:", err);
    return new Response(null, { status: 200 });
  }
}

export const config = {
  // Run on product detail pages only
  matcher: ["/produto/:path*"],
};
