import { useEffect } from "react";

const SITE_URL = "https://voiddrip.com.br";
const SITE_NAME = "Void Drip Society";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

interface ProductMetaProps {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  category?: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

function setMeta(property: string, content: string, isName = false) {
  const attr = isName ? "name" : "property";
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Updates <head> meta tags dynamically for product pages.
 * This improves the native Share experience on iOS/Android
 * and keeps meta tags consistent while navigating.
 *
 * Note: For social crawlers (WhatsApp, Facebook, etc.),
 * the og-meta Supabase Edge Function provides SSR-rendered tags.
 */
export function useProductMeta(product: ProductMetaProps | null | undefined) {
  useEffect(() => {
    if (!product || !product.id) {
      // Reset to site defaults when no product
      document.title = `${SITE_NAME} | Roupas e Acessórios Streetwear`;
      setMeta("og:type", "website");
      setMeta("og:url", `${SITE_URL}/`);
      setMeta("og:title", `${SITE_NAME} | Roupas e Acessórios Streetwear`);
      setMeta("og:description", "Compre roupas e acessórios streetwear na Void Drip Society. Peças selecionadas, estilo urbano e novidades frequentes.");
      setMeta("og:image", DEFAULT_OG_IMAGE);
      setMeta("og:image:width", "1200");
      setMeta("og:image:height", "630");
      setMeta("twitter:card", "summary_large_image");
      setMeta("twitter:title", `${SITE_NAME} | Roupas e Acessórios Streetwear`);
      setMeta("twitter:description", "Compre roupas e acessórios streetwear na Void Drip Society.");
      setMeta("twitter:image", DEFAULT_OG_IMAGE);
      setLink("canonical", `${SITE_URL}/`);
      return;
    }

    const {
      id,
      name = "",
      description = "",
      price = 0,
      image_url = "",
      category = "",
    } = product;

    const productUrl = `${SITE_URL}/produto/${id}`;
    const primaryImage = image_url.split(",")[0]?.trim() || DEFAULT_OG_IMAGE;
    const formattedPrice = formatPrice(price);
    const title = `${name} — ${SITE_NAME}`;
    const ogDescription = description
      ? description.slice(0, 155) + (description.length > 155 ? "…" : "")
      : `${name} por ${formattedPrice}. Streetwear urbano com estilo único. Compre agora.`;

    // Update <title>
    document.title = title;

    // Primary Meta
    setMeta("title", title, true);
    setMeta("description", ogDescription, true);

    // Open Graph
    setMeta("og:type", "product");
    setMeta("og:site_name", SITE_NAME);
    setMeta("og:url", productUrl);
    setMeta("og:title", title);
    setMeta("og:description", ogDescription);
    setMeta("og:image", primaryImage);
    setMeta("og:image:width", "1200");
    setMeta("og:image:height", "630");
    setMeta("og:image:alt", name);
    setMeta("og:locale", "pt_BR");

    // Product-specific OG
    setMeta("product:price:amount", String(price));
    setMeta("product:price:currency", "BRL");
    setMeta("product:availability", "in stock");
    setMeta("product:category", category);

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:url", productUrl);
    setMeta("twitter:title", title);
    setMeta("twitter:description", ogDescription);
    setMeta("twitter:image", primaryImage);
    setMeta("twitter:label1", "Preço");
    setMeta("twitter:data1", formattedPrice);
    setMeta("twitter:label2", "Categoria");
    setMeta("twitter:data2", category);

    // Canonical
    setLink("canonical", productUrl);

    // Cleanup: restore defaults when unmounting
    return () => {
      document.title = `${SITE_NAME} | Roupas e Acessórios Streetwear`;
      setMeta("og:type", "website");
      setMeta("og:url", `${SITE_URL}/`);
      setMeta("og:title", `${SITE_NAME} | Roupas e Acessórios Streetwear`);
      setMeta("og:description", "Compre roupas e acessórios streetwear na Void Drip Society. Peças selecionadas, estilo urbano e novidades frequentes.");
      setMeta("og:image", DEFAULT_OG_IMAGE);
      setMeta("twitter:card", "summary_large_image");
      setMeta("twitter:title", `${SITE_NAME} | Roupas e Acessórios Streetwear`);
      setMeta("twitter:description", "Compre roupas e acessórios streetwear na Void Drip Society.");
      setMeta("twitter:image", DEFAULT_OG_IMAGE);
      setLink("canonical", `${SITE_URL}/`);
    };
  }, [product?.id, product?.name, product?.image_url, product?.price]);
}
