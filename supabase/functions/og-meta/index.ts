import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://voiddrip.com.br";
const SITE_NAME = "Void Drip Society";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Social media bot user-agent patterns
const BOT_PATTERNS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "WhatsApp",
  "LinkedInBot",
  "TelegramBot",
  "Slackbot",
  "discordbot",
  "googlebot",
  "bingbot",
  "Applebot",
  "Pinterest",
  "vkShare",
  "W3C_Validator",
  "ia_archiver",
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some((pattern) => ua.includes(pattern.toLowerCase()));
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

function buildProductHtml(product: {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
}): string {
  const productUrl = `${SITE_URL}/produto/${product.id}`;
  const primaryImage = product.image_url?.split(",")[0]?.trim() ?? DEFAULT_OG_IMAGE;
  const formattedPrice = formatPrice(product.price);
  const title = `${product.name} — ${SITE_NAME}`;
  const description = product.description
    ? `${product.description.slice(0, 155)}…`
    : `${product.name} por ${formattedPrice}. Streetwear urbano com estilo único. Compre agora na Void Drip Society.`;

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Primary Meta Tags -->
    <title>${escapeHtml(title)}</title>
    <meta name="title" content="${escapeHtml(title)}" />
    <meta name="description" content="${escapeHtml(description)}" />

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:url" content="${escapeHtml(productUrl)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(primaryImage)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(product.name)}" />
    <meta property="og:locale" content="pt_BR" />

    <!-- Product-specific OG tags -->
    <meta property="product:price:amount" content="${product.price}" />
    <meta property="product:price:currency" content="BRL" />
    <meta property="product:availability" content="in stock" />
    <meta property="product:category" content="${escapeHtml(product.category)}" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeHtml(productUrl)}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(primaryImage)}" />
    <meta name="twitter:label1" content="Preço" />
    <meta name="twitter:data1" content="${escapeHtml(formattedPrice)}" />
    <meta name="twitter:label2" content="Categoria" />
    <meta name="twitter:data2" content="${escapeHtml(product.category)}" />

    <!-- Canonical + robots -->
    <link rel="canonical" href="${escapeHtml(productUrl)}" />
    <meta name="robots" content="index, follow" />

    <!-- Redirect real users to the SPA -->
    <script>
      // If a real user somehow hits this endpoint, redirect them to the SPA
      if (!/bot|facebookexternalhit|whatsapp|twitterbot|linkedinbot|telegrambot|slackbot|discord|googlebot|bing|applebot|pinterest/i.test(navigator.userAgent)) {
        window.location.replace("${escapeHtml(productUrl)}");
      }
    </script>
  </head>
  <body>
    <!-- Fallback content for non-JS crawlers -->
    <article itemscope itemtype="https://schema.org/Product">
      <h1 itemprop="name">${escapeHtml(product.name)}</h1>
      <img src="${escapeHtml(primaryImage)}" alt="${escapeHtml(product.name)}" itemprop="image" />
      <p itemprop="description">${escapeHtml(product.description ?? "")}</p>
      <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
        <meta itemprop="price" content="${product.price}" />
        <meta itemprop="priceCurrency" content="BRL" />
        <link itemprop="availability" href="https://schema.org/InStock" />
        <a href="${escapeHtml(productUrl)}">Ver produto na loja</a>
      </div>
    </article>
  </body>
</html>`;
}

function buildDefaultHtml(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(SITE_NAME)} | Roupas e Acessórios Streetwear</title>
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE_URL}/" />
    <meta property="og:title" content="${escapeHtml(SITE_NAME)} | Roupas e Acessórios Streetwear" />
    <meta property="og:description" content="Compre roupas e acessórios streetwear na Void Drip Society. Peças selecionadas, estilo urbano e novidades frequentes." />
    <meta property="og:image" content="${DEFAULT_OG_IMAGE}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />
    <script>window.location.replace("${SITE_URL}");</script>
  </head>
  <body><a href="${SITE_URL}">${escapeHtml(SITE_NAME)}</a></body>
</html>`;
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Expected path: /og-meta/produto/{id}
  // or query param: /og-meta?id={productId}
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Support both /og-meta/produto/{id} and ?id={id}
  let productId: string | null = url.searchParams.get("id");
  
  if (!productId) {
    // Try extracting from path: /og-meta/produto/{id}
    const prodIdx = pathParts.indexOf("produto");
    if (prodIdx !== -1 && pathParts[prodIdx + 1]) {
      productId = pathParts[prodIdx + 1];
    }
  }

  if (!productId) {
    // No product ID — return default site OG
    return new Response(buildDefaultHtml(), {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: product, error } = await supabase
      .from("products")
      .select("id, name, description, price, image_url, category")
      .eq("id", productId)
      .single();

    if (error || !product) {
      // Product not found — return default with 404
      return new Response(buildDefaultHtml(), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const html = buildProductHtml(product);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        // Cache for 5 minutes on CDN edge, 1 minute stale-while-revalidate
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("og-meta error:", err);
    return new Response(buildDefaultHtml(), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
