import { useState, useEffect } from "react";
import { Product } from "./ProductGrid";
import { ShoppingBag, ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/95 backdrop-blur-md p-0 md:p-12">
      {/* Background overlay for click-to-close */}
      <div 
        className="absolute inset-0 cursor-pointer pointer-events-auto" 
        onClick={onClose}
      />

      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full h-full md:w-[85vw] md:h-[80vh] bg-card border-none md:border md:border-border shadow-2xl flex flex-col md:flex-row overflow-hidden"
      >
        {/* Mobile Header - Glassmorphism */}
        <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-background/60 backdrop-blur-xl border-b border-white/10 z-[160] flex items-center justify-between px-6">
          <span className="font-display text-[10px] tracking-[0.4em] text-foreground uppercase pt-1">
            {product.category}
          </span>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 text-foreground rounded-full active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="hidden md:flex absolute top-8 right-8 z-[130] w-10 h-10 items-center justify-center bg-background/20 backdrop-blur-xl border border-white/10 text-foreground transition-all duration-300 rounded-full hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 shadow-2xl group"
        >
          <X size={20} className="transition-transform group-hover:rotate-90" />
        </button>

        {/* Gallery Section */}
        <div className="w-full md:w-1/3 relative bg-secondary min-h-[50vh] md:min-h-0 flex items-stretch mt-16 md:mt-0 overflow-hidden border-r border-white/5">
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
                        className={`h-1 transition-all duration-500 ease-out rounded-full ${idx === currentImageIndex ? 'w-6 bg-primary' : 'w-1.5 bg-white/20'}`} 
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground font-display text-[10px] tracking-widest uppercase opacity-20">No Image</span>
            </div>
          )}
        </div>

        {/* Details Section - Swipeable on mobile */}
        <motion.div 
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y > 150) {
              onClose();
            }
          }}
          className="w-full md:w-2/3 p-6 md:p-16 flex flex-col bg-card relative -mt-8 md:mt-0 rounded-t-[2.5rem] md:rounded-none z-20 md:overflow-y-auto custom-scrollbar shadow-[0_-20px_50px_rgba(0,0,0,0.5)] md:shadow-none"
        >
          {/* Swipe Handle */}
          <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-8 md:hidden flex-shrink-0" />

          <div className="flex-grow flex flex-col md:justify-center overflow-y-auto md:overflow-visible pb-20 md:pb-0">
            <p className="hidden md:block font-display text-[9px] md:text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-2">
              {product.category}
            </p>
            <h1 className="font-display text-2xl md:text-5xl text-foreground mb-3 md:mb-6 tracking-widest uppercase leading-tight">
              {product.name}
            </h1>
            <p className="font-display text-xl md:text-2xl text-primary mb-8 md:mb-12 tracking-wider">
              {formatPrice(product.price)}
            </p>

            {product.description && (
              <div className="font-body text-sm md:text-base text-muted-foreground/80 leading-relaxed mb-10 whitespace-pre-wrap">
                {product.description}
              </div>
            )}

            {( (product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0) ) && (
              <div className="flex flex-col gap-10 mb-12">
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <span className="font-display text-[9px] md:text-[10px] tracking-[0.2em] text-foreground/40 block mb-5 uppercase">TAMANHO</span>
                    <div className="flex flex-wrap gap-3">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`font-display text-xs w-11 h-11 md:w-12 md:h-12 border transition-all duration-300 ${selectedSize === size
                              ? "border-primary text-primary bg-primary/5 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                              : "border-border text-muted-foreground hover:border-foreground"
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
                    <span className="font-display text-[9px] md:text-[10px] tracking-[0.2em] text-foreground/40 block mb-5 uppercase">COR</span>
                    <div className="flex flex-wrap gap-3">
                      {product.colors.map((color) => {
                        const isSoldOut = color.endsWith('*');
                        const displayName = isSoldOut ? color.slice(0, -1) : color;
                        return (
                          <button
                            key={color}
                            disabled={isSoldOut}
                            onClick={() => setSelectedColor(color)}
                            className={`font-display text-[10px] uppercase tracking-widest px-6 py-3 border transition-all duration-300 relative ${isSoldOut
                                ? "border-border text-muted-foreground/20 cursor-not-allowed"
                                : selectedColor === color
                                  ? "border-primary text-primary bg-primary/5 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                  : "border-border text-muted-foreground"
                              }`}
                          >
                            <span className={isSoldOut ? "line-through opacity-50" : ""}>{displayName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 bg-card">
            <button
              disabled={product.stock_quantity <= 0}
              className={`w-full py-5 md:py-4 px-6 border font-display tracking-[0.3em] text-xs flex items-center justify-center gap-3 transition-all duration-500 ${product.stock_quantity > 0
                  ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_30px_white/10]"
                  : "border-border text-muted-foreground cursor-not-allowed opacity-50"
                }`}
            >
              <ShoppingBag size={18} />
              {product.stock_quantity > 0 ? "ADICIONAR AO CARRINHO" : "ESGOTADO"}
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Full Description Modal layer */}
      <AnimatePresence>
        {showFullDesc && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-2xl p-6 md:p-24"
          >
            <div className="w-full max-w-2xl bg-card border border-border p-8 md:p-12 relative max-h-full overflow-y-auto shadow-3xl">
              <button onClick={() => setShowFullDesc(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
                <X size={24} />
              </button>
              <h3 className="font-display text-[10px] tracking-[0.4em] text-muted-foreground mb-8 uppercase">DESCRIÇÃO</h3>
              <div className="font-body text-base md:text-lg text-foreground leading-relaxed whitespace-pre-wrap">
                {product.description}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductModal;

