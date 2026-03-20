import { useState, useEffect } from "react";
import { Product } from "./ProductGrid";
import { ShoppingBag, ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

const ProductModal = ({ product, onClose }: ProductModalProps) => {
  const images = product.image_url ? product.image_url.split(',') : [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const [showFullDesc, setShowFullDesc] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
  };

  const getTruncatedDesc = (text: string) => {
    if (text.length <= 250) return text;
    const truncated = text.slice(0, 250);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.slice(0, lastSpace > 0 ? lastSpace : 250) + "...";
  };

  const isLongDesc = (product.description || "").length > 250;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/90 backdrop-blur-md p-0 md:p-12 animate-fade-up">
      <div className="relative w-full h-full md:w-[85vw] md:h-[80vh] bg-card border-none md:border md:border-border shadow-2xl flex flex-col md:flex-row overflow-hidden">


        {/* Mobile Header - Glassmorphism */}
        <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-background/60 backdrop-blur-xl border-b border-white/10 z-[120] flex items-center justify-center">
          <span className="font-display text-[10px] tracking-[0.4em] text-foreground uppercase pt-1">
            {product.category}
          </span>
        </div>

        {/* Close Button - Modernized */}
        <button
          onClick={onClose}
          className="fixed md:absolute top-16 md:top-8 right-6 md:right-8 z-[130] w-12 h-12 md:w-10 md:h-10 flex items-center justify-center bg-background/20 backdrop-blur-xl border border-white/10 text-foreground transition-all duration-300 rounded-full hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.5)] group"
        >
          <X size={24} className="transition-transform group-hover:rotate-90" />
        </button>

        {/* Gallery Section - 1/3 of the modal on Desktop */}
        <div className="w-full md:w-1/3 relative bg-secondary min-h-[50vh] md:min-h-0 flex items-stretch mt-14 md:mt-0 overflow-hidden border-r border-white/5">
          {images.length > 0 ? (
            <div
              className="w-full h-full relative group touch-pan-y flex items-center justify-center"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-500 pointer-events-none"
              />
              {images.length > 1 && (
                <>
                  {/* Desktop Nav Buttons */}
                  <div className="hidden md:flex absolute inset-x-4 top-1/2 -translate-y-1/2 justify-between z-10 pointer-events-none w-[calc(100%-32px)]">
                    <button 
                      onClick={(e) => { e.stopPropagation(); prevImage(); }} 
                      className="w-10 h-10 flex items-center justify-center bg-background/20 backdrop-blur-xl border border-white/10 text-foreground transition-all duration-300 rounded-full hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 pointer-events-auto shadow-2xl"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); nextImage(); }} 
                      className="w-10 h-10 flex items-center justify-center bg-background/20 backdrop-blur-xl border border-white/10 text-foreground transition-all duration-300 rounded-full hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 pointer-events-auto shadow-2xl"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-background/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                    {images.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-1 rounded-full transition-all duration-500 ease-out ${idx === currentImageIndex
                            ? 'w-6 bg-primary shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                            : 'w-1.5 bg-white/20'
                        }`} 
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg viewBox="0 0 200 280" className="w-1/2 h-1/2 opacity-20" fill="none" stroke="currentColor" strokeWidth="0.5">
                <ellipse cx="100" cy="50" rx="25" ry="30" className="text-muted-foreground" />
                <path d="M75 70 L60 120 L80 110 L80 250 L120 250 L120 110 L140 120 L125 70" className="text-muted-foreground" />
              </svg>
            </div>
          )}
        </div>

        {/* Details Section - 2/3 of the modal on Desktop */}
        <div className="w-full md:w-2/3 p-6 md:p-16 flex flex-col justify-center bg-card relative -mt-6 md:mt-0 rounded-t-[2rem] md:rounded-none z-20 md:overflow-y-auto custom-scrollbar">
          <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6 md:hidden" />

          <p className="hidden md:block font-display text-[9px] md:text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-2">
            {product.category}
          </p>
          <h1 className="font-display text-2xl md:text-4xl text-foreground mb-3 md:mb-4 tracking-widest uppercase leading-tight">
            {product.name}
          </h1>
          <p className="font-display text-xl md:text-2xl text-primary mb-6 md:mb-8 tracking-wider">
            {formatPrice(product.price)}
          </p>

          {product.description && (
            <>
              <div className="font-body text-sm md:text-base text-muted-foreground/80 leading-relaxed mb-4 flex-1 whitespace-pre-wrap overflow-y-auto">
                <span className="md:hidden">{product.description}</span>
              </div>

              <button 
                onClick={() => setShowFullDesc(true)}
                className="hidden md:flex items-center gap-2 text-[10px] tracking-widest text-primary hover:text-primary/70 transition-colors uppercase font-display mb-12"
              >
                <Maximize2 size={12} />
                ver descrição.
              </button>
            </>
          )}

          {( (product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0) ) && (
            <div className="flex flex-col gap-8 mb-10 md:mb-12 mt-auto">
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <span className="font-display text-[9px] md:text-[10px] tracking-[0.2em] text-foreground/60 block mb-4">TAMANHO</span>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`font-display text-xs w-12 h-12 md:w-10 md:h-10 border transition-all duration-300 ${selectedSize === size
                            ? "border-primary text-primary bg-primary/5 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                            : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.colors && product.colors.length > 0 && (
                <div>
                  <span className="font-display text-[9px] md:text-[10px] tracking-[0.2em] text-foreground/60 block mb-4">COR</span>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => {
                      const isSoldOut = color.endsWith('*');
                      const displayName = isSoldOut ? color.slice(0, -1) : color;

                      return (
                        <button
                          key={color}
                          disabled={isSoldOut}
                          onClick={() => setSelectedColor(color)}
                          className={`font-display text-[10px] uppercase tracking-wider px-5 py-3 border transition-all duration-300 relative ${isSoldOut
                              ? "border-border text-muted-foreground/30 cursor-not-allowed overflow-hidden shadow-none"
                              : selectedColor === color
                                ? "border-primary text-primary bg-primary/5 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          <span className={isSoldOut ? "line-through grayscale opacity-50" : ""}>
                            {displayName}
                          </span>
                          {isSoldOut && (
                            <div className="absolute inset-0 bg-background/40" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            disabled={product.stock_quantity <= 0}
            className={`w-full py-5 md:py-4 px-6 border font-display tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all duration-300 ${product.stock_quantity > 0
                ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_30px_hsl(var(--glow-white))]"
                : "border-border text-muted-foreground cursor-not-allowed opacity-50"
              }`}
          >
            <ShoppingBag size={20} />
            {product.stock_quantity > 0 ? "ADICIONAR AO CARRINHO" : "ESGOTADO"}
          </button>
        </div>

      </div>

      {/* Full Description Modal layer */}
      {showFullDesc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-2xl p-6 md:p-24 animate-fade-up">
          <div className="w-full max-w-2xl bg-card border border-border p-12 relative max-h-full overflow-y-auto shadow-3xl">
            <button 
              onClick={() => setShowFullDesc(false)} 
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-all hover:scale-110"
            >
              <X size={24} />
            </button>
            <h3 className="font-display text-xs tracking-[0.3em] text-muted-foreground mb-8 uppercase">SOBRE O PRODUTO</h3>
            <div className="font-body text-lg text-foreground leading-relaxed whitespace-pre-wrap">
              {product.description}
            </div>
            <button 
              onClick={() => setShowFullDesc(false)} 
              className="mt-12 text-[10px] tracking-widest text-primary hover:text-primary/70 transition-colors uppercase font-display"
            >
              fechar detalhes.
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductModal;
