import { Product } from "./ProductGrid";
import { Flame } from "lucide-react";
import { useLazyImage } from "@/hooks/useLazyImage";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  isTrending?: boolean;
  /** Skip lazy-loading and fetch image immediately (above the fold) */
  eager?: boolean;
}

const GarmentPlaceholder = () => (
  <svg
    viewBox="0 0 200 280"
    className="w-2/3 h-2/3 opacity-20"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.5"
  >
    <ellipse cx="100" cy="50" rx="25" ry="30" className="text-muted-foreground" />
    <path d="M75 70 L60 120 L80 110 L80 250 L120 250 L120 110 L140 120 L125 70" className="text-muted-foreground" />
  </svg>
);

const ProductCard = ({ product, onClick, isTrending, eager = false }: ProductCardProps) => {
  const images = product.image_url ? product.image_url.split(',') : [];
  const firstImage = images.length > 0 ? images[0] : null;

  // Lazy-load: image src is only set once the card scrolls into view
  const { containerRef, loadedSrc, isLoaded, onLoad } = useLazyImage(firstImage, { eager });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  return (
    <div className="product-card group cursor-pointer" onClick={onClick}>
      <div
        ref={containerRef}
        className="aspect-[3/4] bg-secondary flex items-center justify-center overflow-hidden relative"
      >
        <div className="product-image w-full h-full flex items-center justify-center">
          {firstImage ? (
            <>
              {/* Skeleton shimmer shown until image loads */}
              {!isLoaded && (
                <div className="absolute inset-0 bg-secondary animate-pulse" />
              )}
              {loadedSrc && (
                <img
                  src={loadedSrc}
                  alt={product.name}
                  onLoad={onLoad}
                  loading={eager ? "eager" : "lazy"}
                  decoding="async"
                  className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
                />
              )}
            </>
          ) : (
            <GarmentPlaceholder />
          )}
        </div>

        {isTrending && product.stock_quantity > 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 md:left-3 md:translate-x-0 z-20">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-md scale-150 animate-pulse" />

            <div
              className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full animate-fire-glow border border-orange-400/60 backdrop-blur-md overflow-hidden whitespace-nowrap"
              style={{ background: 'linear-gradient(to right, rgba(234,88,12,0.85), rgba(249,115,22,0.75), rgba(251,191,36,0.65))' }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'badge-shimmer 2.5s linear infinite',
                }}
              />

              <Flame
                size={11}
                className="relative text-white drop-shadow-[0_0_5px_rgba(251,146,60,1)]"
                fill="rgba(253,186,116,0.7)"
                style={{ animation: 'pulse 0.9s ease-in-out infinite' }}
              />
              <span className="relative font-display text-[7px] tracking-[0.25em] text-white uppercase font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                EM ALTA
              </span>
            </div>
          </div>
        )}


        {product.stock_quantity <= 0 && (
          <>
            <div className="absolute top-3 left-1/2 -translate-x-1/2 md:left-3 md:translate-x-0 z-30">
              <div className="absolute inset-0 rounded-full bg-white/5 blur-md scale-150" />
              <div
                className="relative flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20 backdrop-blur-xl overflow-hidden whitespace-nowrap"
                style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.8), rgba(40,40,40,0.8))' }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'badge-shimmer 3s linear infinite',
                  }}
                />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
                <span className="relative font-display text-[7px] tracking-[0.4em] text-foreground select-none uppercase font-bold">
                  ESGOTADO
                </span>
              </div>
            </div>

            <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center gap-2 overflow-hidden px-4">
              <div className="relative mt-1">
                <span className="font-display text-4xl select-none opacity-40 animate-glitch-1 inline-block text-white">:(</span>
                <span className="absolute inset-0 font-display text-4xl select-none opacity-20 animate-glitch-2 text-primary pointer-events-none">:(</span>
              </div>
            </div>
          </>
        )}

        {/* Hover overlay */}
        <div className="product-info-overlay absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
          <button className="font-display text-[10px] tracking-[0.3em] text-foreground border border-foreground px-6 py-2 hover:bg-foreground hover:text-background transition-all duration-300 cursor-pointer">
            VER
          </button>
        </div>
      </div>

      <div className="p-2 md:p-4">
        <h3 className="font-display text-[8px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em] text-foreground line-clamp-1">{product.name}</h3>
        <p className="font-body text-[9px] md:text-xs text-muted-foreground mt-0.5">{formatPrice(product.price)}</p>
      </div>
    </div>
  );
};

export default ProductCard;
