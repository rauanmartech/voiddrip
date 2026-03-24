import { NextResponse } from "next/server";
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") ?? "";

  // Only intercept /produto/:id routes
  const productMatch = pathname.match(/^\/produto\/([^/]+)$/);
  if (!productMatch) {
    return NextResponse.next();
  }

  // Only intercept if it's a social media bot
  if (!isSocialBot(userAgent)) {
    return NextResponse.next();
  }

  const productId = productMatch[1];

  // Proxy to the Supabase Edge Function that returns product-specific OG HTML
  const ogMetaUrl = `https://vfjmwbxvticnwfmvoonc.supabase.co/functions/v1/og-meta?id=${encodeURIComponent(productId)}`;

  return NextResponse.rewrite(ogMetaUrl);
}

export const config = {
  // Only run middleware on product detail pages
  matcher: ["/produto/:path*"],
};
