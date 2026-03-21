import { useNavigate } from "react-router-dom";
import { Product } from "./ProductGrid";
import { motion, AnimatePresence } from "framer-motion";
import { trackProductView } from "@/lib/analytics";
import { useTrendingProducts } from "@/hooks/useProducts";
import { useLazyImage } from "@/hooks/useLazyImage";

interface TrendingCardProps {
  product: Product;
  isMain?: boolean;
  index: number;
  onClick: () => void;
}

const TrendingCard = ({ product, isMain = false, index, onClick }: TrendingCardProps) => {
  const images = product.image_url ? product.image_url.split(',') : [];
  const firstImage = images.length > 0 ? images[0] : null;

  // Trending section is near top of page — first card is eager, rest lazy
  const { containerRef, loadedSrc, isLoaded, onLoad } = useLazyImage(firstImage, { eager: index === 0 });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
      onClick={onClick}
      className={`relative group cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] ${isMain ? 'h-[400px] md:h-[600px]' : 'h-[190px] md:h-[285px]'}`}
    >
      {/* Premium Border & Glow */}
      <div className="absolute inset-0 border border-white/5 group-hover:border-white/20 transition-colors duration-700 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Indicator */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
        <span className="font-display text-[8px] tracking-[0.3em] text-white uppercase opacity-70 group-hover:opacity-100 transition-opacity">
          {index === 0 ? "TOP NA VOID" : "TRENDING"}
        </span>
      </div>

      {/* Image Container with lazy loading */}
      <div
        ref={containerRef}
        className="w-full h-full bg-secondary overflow-hidden"
      >
        {firstImage ? (
          <>
            {!isLoaded && <div className="absolute inset-0 bg-secondary animate-pulse" />}
            {loadedSrc && (
              <img
                src={loadedSrc}
                alt={product.name}
                onLoad={onLoad}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                className={`w-full h-full object-cover transition-all duration-1000 ease-out group-hover:scale-105 ${isLoaded ? "opacity-100" : "opacity-0"}`}
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-10">
            <svg viewBox="0 0 200 280" className="w-1/2 h-1/2" fill="none" stroke="currentColor" strokeWidth="0.5">
              <ellipse cx="100" cy="50" rx="25" ry="30" />
              <path d="M75 70 L60 120 L80 110 L80 250 L120 250 L120 110 L140 120 L125 70" />
            </svg>
          </div>
        )}
      </div>

      {/* Info Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 z-20">
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <h3 className={`font-display tracking-[0.2em] text-white uppercase ${isMain ? 'text-lg md:text-2xl' : 'text-[10px] md:text-xs'}`}>
            {product.name}
          </h3>
          <p className="font-body text-[10px] text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>

      {/* Reveal Button */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30">
        <div className="px-6 py-2 border border-white/50 backdrop-blur-md text-white font-display text-[10px] tracking-[0.4em] uppercase">
          EXPLORAR
        </div>
      </div>
    </motion.div>
  );
};

const TrendingSection = () => {
  const navigate = useNavigate();

  // ── React Query: shares cache with ProductGrid, no duplicate request ────────
  const { data: trendingProducts = [], isLoading } = useTrendingProducts();

  const handleProductClick = (product: Product) => {
    navigate(`/produto/${product.id}`);
    trackProductView(product.id).catch(err => console.error("Tracking error:", err));
  };

  if (isLoading || trendingProducts.length === 0) return null;

  return (
    <section id="trending" className="relative py-24 md:py-32 overflow-hidden bg-background">
      {/* Cosmic Geometric Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%]" viewBox="0 0 1000 1000">
          <circle cx="500" cy="500" r="400" fill="none" stroke="white" strokeWidth="0.2" strokeDasharray="2 12" className="animate-[spin-slow_120s_linear_infinite]" />
          <circle cx="500" cy="500" r="250" fill="none" stroke="white" strokeWidth="0.1" className="opacity-50" />
          <line x1="0" y1="500" x2="1000" y2="500" stroke="white" strokeWidth="0.1" className="opacity-10" />
          <line x1="500" y1="0" x2="500" y2="1000" stroke="white" strokeWidth="0.1" className="opacity-10" />
        </svg>
        <div className="absolute inset-0 bg-radial-vignette" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 px-2">
          <div className="space-y-4">
            <div className="w-12 h-px bg-white/30" />
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl tracking-[-0.02em] text-foreground">
              EM ALTA <span className="text-muted-foreground/30">NA VOID</span>
            </h2>
          </div>
          <p className="font-display text-[10px] tracking-[0.4em] text-muted-foreground uppercase max-w-[200px] leading-relaxed">
            OS ARTEFATOS MAIS DESEJADOS DO MOMENTO.
          </p>
        </div>

        {/* Asymmetric Dynamic Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {/* Main Focus (Top 1) */}
          <div className="md:col-span-7">
            <TrendingCard
              product={trendingProducts[0]}
              isMain={true}
              index={0}
              onClick={() => handleProductClick(trendingProducts[0])}
            />
          </div>

          {/* Secondary Items */}
          <div className="md:col-span-5 flex flex-col gap-4 md:gap-6">
            {trendingProducts.slice(1, 3).map((product, idx) => (
              <TrendingCard
                key={product.id}
                product={product}
                isMain={false}
                index={idx + 1}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>
        </div>
      </div>

    </section>
  );
};

export default TrendingSection;
