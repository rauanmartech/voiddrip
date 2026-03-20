import { useState, useEffect, useCallback } from "react";
import { Product } from "./ProductGrid";
import { ShoppingBag, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

const ProductModal = ({ product, onClose }: ProductModalProps) => {
  const images = product.image_url ? product.image_url.split(',') : [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0); // For gallery transition direction

  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");

  // Prefetch all images for instant navigation
  useEffect(() => {
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentImageIndex((prev) => (prev + newDirection + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Gallery Animation Variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/95 backdrop-blur-md overflow-hidden">
      {/* Background overlay for click-to-close */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full h-full md:w-[90vw] md:h-[85vh] md:max-w-6xl bg-card border-none md:border md:border-white/10 shadow-3xl flex flex-col md:flex-row overflow-hidden md:rounded-sm"
      >
        {/* Mobile Navbar Overlay - Higher Z than images */}
        <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-[170] flex items-center justify-between px-6 pointer-events-none">
          <span className="font-display text-[9px] tracking-[0.4em] text-white uppercase pt-1 drop-shadow-md">
            {product.category}
          </span>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-black/20 backdrop-blur-xl border border-white/20 text-white rounded-full active:scale-90 transition-transform pointer-events-auto shadow-2xl"
          >
            <X size={18} />
          </button>
        </div>

        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="hidden md:flex absolute top-8 right-8 z-[170] w-12 h-12 items-center justify-center bg-background/20 backdrop-blur-xl border border-white/10 text-foreground transition-all duration-300 rounded-full hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 shadow-2xl group"
        >
          <X size={22} className="transition-transform group-hover:rotate-90" />
        </button>

        {/* Gallery Section - Full height on mobile (background for the bottom sheet) */}
        <div className="absolute inset-0 md:relative md:w-1/2 bg-black overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentImageIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.4 },
                scale: { duration: 0.4 }
              }}
              className="absolute inset-0 flex items-center justify-center touch-none"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              onDragEnd={(_, info) => {
                const swipe = info.offset.x;
                if (swipe < -50) {
                  paginate(1);
                } else if (swipe > 50) {
                  paginate(-1);
                }
              }}
            >
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover pointer-events-none"
              />
            </motion.div>
          </AnimatePresence>

          {/* Gallery UI overlays */}
          <div className="absolute bottom-40 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[165] bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentImageIndex ? 1 : -1);
                  setCurrentImageIndex(idx);
                }}
                className={`h-1 transition-all duration-500 rounded-full ${idx === currentImageIndex ? 'w-6 bg-primary shadow-[0_0_10px_white]' : 'w-1.5 bg-white/30'}`} 
              />
            ))}
          </div>

          {/* Desktop Nav Arrows */}
          <button 
            onClick={() => paginate(-1)} 
            className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-[165] w-12 h-12 items-center justify-center bg-background/20 backdrop-blur-xl border border-white/10 text-white rounded-full hover:bg-white hover:text-black transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => paginate(1)} 
            className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-[165] w-12 h-12 items-center justify-center bg-background/20 backdrop-blur-xl border border-white/10 text-white rounded-full hover:bg-white hover:text-black transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Details Section - Bottom Sheet on Mobile */}
        <motion.div 
          initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { y: "65%" } : {}}
          animate={typeof window !== 'undefined' && window.innerWidth < 768 ? { y: "45%" } : {}}
          drag={typeof window !== 'undefined' && window.innerWidth < 768 ? "y" : false}
          dragConstraints={typeof window !== 'undefined' && window.innerWidth < 768 ? { top: -400, bottom: 500 } : {}}
          dragElastic={0.1}
          onDragEnd={(_, info) => {
            if (info.offset.y > 200) {
              onClose();
            }
          }}
          className="w-full md:w-1/2 h-full bg-card relative z-[168] md:z-auto flex flex-col md:rounded-none rounded-t-[2.5rem] shadow-[0_-15px_60px_rgba(0,0,0,0.8)] md:shadow-none"
        >
          {/* Handle for Mobile Dragging */}
          <div className="md:hidden flex flex-col items-center pt-4 pb-6 flex-shrink-0 cursor-grab active:cursor-grabbing">
            <div className="w-16 h-1.5 bg-white/20 rounded-full shadow-inner" />
            <span className="font-display text-[7px] tracking-[0.5em] text-white/30 uppercase mt-3">Arraste para Ver</span>
          </div>

          <div className="flex-grow overflow-y-auto px-8 md:px-16 pt-2 md:pt-20 pb-20 custom-scrollbar">
            <p className="hidden md:block font-display text-[10px] tracking-[0.4em] text-muted-foreground uppercase mb-4">
              {product.category}
            </p>
            <h1 className="font-display text-2xl md:text-5xl text-foreground mb-4 md:mb-8 tracking-widest uppercase leading-[1.1]">
              {product.name}
            </h1>
            <p className="font-display text-2xl md:text-3xl text-primary mb-10 md:mb-16 tracking-wider">
              {formatPrice(product.price)}
            </p>

            <div className="space-y-12 mb-16">
              {product.description && (
                <div>
                  <h4 className="font-display text-[9px] tracking-[0.3em] text-muted-foreground uppercase mb-4">SOBRE O PRODUTO</h4>
                  <div className="font-body text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h4 className="font-display text-[9px] tracking-[0.3em] text-muted-foreground uppercase mb-5">TAMANHO DISPONÍVEL</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`font-display text-xs w-11 h-11 border transition-all duration-300 ${selectedSize === size
                            ? "border-primary text-primary bg-primary/5 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                            : "border-white/10 text-muted-foreground hover:border-white/30 hover:text-foreground"
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
                  <h4 className="font-display text-[9px] tracking-[0.3em] text-muted-foreground uppercase mb-5">ESCOLHER COR</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((color) => {
                      const isSoldOut = color.endsWith('*');
                      const displayName = isSoldOut ? color.slice(0, -1) : color;
                      return (
                        <button
                          key={color}
                          disabled={isSoldOut}
                          onClick={() => setSelectedColor(color)}
                          className={`font-display text-[9px] uppercase tracking-widest px-5 py-3.5 border transition-all duration-300 relative ${isSoldOut
                              ? "border-white/5 text-white/10 cursor-not-allowed"
                              : selectedColor === color
                                ? "border-primary text-primary bg-primary/5 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                : "border-white/10 text-muted-foreground hover:border-white/30 hover:text-foreground"
                            }`}
                        >
                          <span className={isSoldOut ? "line-through opacity-30" : ""}>{displayName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Footer for Button */}
          <div className="mt-auto px-8 md:px-16 pb-8 pt-4 md:pb-16 bg-card border-t border-white/5">
            <button
              disabled={product.stock_quantity <= 0}
              className={`w-full py-5 border font-display tracking-[0.3em] text-xs flex items-center justify-center gap-3 transition-all duration-500 ${product.stock_quantity > 0
                  ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                  : "border-white/5 text-white/10 cursor-not-allowed opacity-50"
                }`}
            >
              <ShoppingBag size={18} />
              {product.stock_quantity > 0 ? "ADICIONAR AO CARRINHO" : "ITEM ESGOTADO"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProductModal;


