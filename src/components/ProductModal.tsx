import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Product } from "./ProductGrid";
import { ShoppingBag, ChevronLeft, ChevronRight, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

const ProductModal = ({ product, onClose }: ProductModalProps) => {
  const images = product.image_url ? product.image_url.split(',') : [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [showHeader, setShowHeader] = useState(true);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (product.sizes?.length && !selectedSize) {
      toast.error("Selecione um tamanho");
      return;
    }
    if (product.colors?.length && !selectedColor) {
      toast.error("Selecione uma cor");
      return;
    }

    addToCart(product, selectedSize, selectedColor);
    onClose(); // Fecha o modal para focar no carrinho
  };

  // Image prefetch
  useEffect(() => {
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentImageIndex((prev) => (prev + newDirection + images.length) % images.length);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.1,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9,
    }),
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-12 overflow-hidden">
      {/* Background Atmosphere - Solid Fade */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/98 backdrop-blur-2xl pointer-events-none"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
        </div>
      </motion.div>

      <motion.div 
        initial={{ y: "100%", opacity: 0, scale: 1 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: "100%", opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="relative w-full h-full md:w-[90vw] md:h-[85vh] md:max-w-6xl bg-card/40 md:bg-card border-none md:border md:border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col md:flex-row overflow-hidden z-[160]"
      >
        
        {/* MOBILE UI — START */}
        <div className="md:hidden flex flex-col h-full w-full relative">
          
          {/* Mobile Header Overlay */}
          <AnimatePresence>
            {showHeader && (
              <motion.div 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/90 to-transparent z-[170] flex items-center justify-between px-6 pointer-events-none"
              >
                <div className="flex flex-col">
                  <span className="font-display text-[8px] tracking-[0.5em] text-primary drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] uppercase opacity-80">
                    VOID DRIP
                  </span>
                  <span className="font-display text-[10px] tracking-[0.2em] text-white uppercase mt-1 drop-shadow-md">
                    {product.category}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 text-white rounded-full active:scale-90 transition-transform pointer-events-auto"
                >
                  <X size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Image Stack (Fixes 'travando' by using simple transitions) */}
          <div className="relative w-full aspect-square bg-black overflow-hidden flex-shrink-0">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.img
                key={currentImageIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 200, damping: 25 },
                  opacity: { duration: 0.3 }
                }}
                src={images[currentImageIndex]}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -40) paginate(1);
                  else if (info.offset.x > 40) paginate(-1);
                }}
              />
            </AnimatePresence>

            {/* Pagination Indicators - Dot Style */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
              {images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-0.5 transition-all duration-300 ${idx === currentImageIndex ? 'w-8 bg-primary shadow-[0_0_10px_white]' : 'w-2 bg-white/20'}`} 
                />
              ))}
            </div>
          </div>

          {/* Details Section — The "Aba" (Bottom Sheet) rebuilt for performance and futuristic look */}
          <div 
            className="flex-1 bg-[#090909] relative z-[175] overflow-y-auto mt-[-2rem] rounded-t-[2.5rem] border-t border-white/5 flex flex-col no-scrollbar cursor-default"
          >
            
            <div className="p-8 pb-32 relative">
              {/* Detailed Card Close Button (Mobile Only) */}
              <button
                onClick={onClose}
                className="absolute top-8 right-8 w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 text-white/40 rounded-full active:scale-95 transition-all"
              >
                <X size={16} />
              </button>

              <h1 className="font-display text-2xl text-foreground tracking-[0.1em] uppercase leading-tight mb-2 pr-12">
                {product.name}
              </h1>
              <p className="font-display text-sm tracking-[0.4em] text-primary/80 mb-6 uppercase">
                {formatPrice(product.price)}
              </p>

              <div className="space-y-10">
                {product.description && (
                  <div>
                    <h4 className="font-display text-[8px] tracking-[0.4em] text-muted-foreground uppercase border-b border-white/5 pb-2 mb-4">SPECIFICATIONS</h4>
                    <p className="font-body text-xs text-muted-foreground/80 leading-relaxed font-light tracking-wide">
                      {product.description}
                    </p>
                  </div>
                )}

                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <h4 className="font-display text-[8px] tracking-[0.4em] text-muted-foreground uppercase border-b border-white/5 pb-2 mb-4">AVAILABLE SIZES</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {product.sizes.map((size) => {
                        const isSoldOut = size.endsWith('*');
                        const displayName = isSoldOut ? size.slice(0, -1) : size;
                        return (
                          <button
                            key={size}
                            disabled={isSoldOut}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSize(size);
                            }}
                            className={`font-display text-[10px] w-12 h-12 border transition-all duration-300 flex items-center justify-center ${isSoldOut
                                ? "border-white/5 text-white/10 cursor-not-allowed"
                                : selectedSize === size
                                  ? "border-primary text-white bg-white/5"
                                  : "border-white/5 text-muted-foreground"
                              }`}
                          >
                            <span className={isSoldOut ? "line-through opacity-30" : ""}>{displayName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {product.colors && product.colors.length > 0 && (
                  <div>
                    <h4 className="font-display text-[8px] tracking-[0.4em] text-muted-foreground uppercase border-b border-white/5 pb-2 mb-4">COLOR HARMONY</h4>
                    <div className="flex flex-col gap-2">
                      {product.colors.map((color) => {
                        const isSoldOut = color.endsWith('*');
                        const displayName = isSoldOut ? color.slice(0, -1) : color;
                        return (
                          <button
                            key={color}
                            disabled={isSoldOut}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedColor(color);
                            }}
                            className={`font-display text-[9px] uppercase tracking-[0.3em] w-full py-4 border transition-all duration-300 text-left px-5 flex items-center justify-between ${isSoldOut
                                ? "border-white/5 text-white/10 cursor-not-allowed bg-black/40"
                                : selectedColor === color
                                  ? "border-primary text-white bg-white/5"
                                  : "border-white/5 text-muted-foreground"
                              }`}
                          >
                            <span className={isSoldOut ? "line-through opacity-30" : ""}>{displayName}</span>
                            {selectedColor === color && !isSoldOut && <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_white]" />}
                            {isSoldOut && <span className="text-[7px] tracking-widest text-white/20">OUT</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Floating Action Bar — Pure Void Vibe */}
          <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-[180]">
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity <= 0}
              className={`w-full py-4 px-8 border font-display tracking-[0.5em] text-[10px] flex items-center justify-between transition-all duration-500 overflow-hidden group ${product.stock_quantity > 0
                  ? "border-primary bg-white text-black hover:shadow-[0_0_30px_white]"
                  : "border-white/10 text-white/20 bg-transparent grayscale"
                }`}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={14} />
                {product.stock_quantity > 0 ? "INICIAR DRIP" : "ESGOTADO"}
              </span>
              <ArrowRight size={14} className="group-active:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
        {/* MOBILE UI — END */}


        {/* DESKTOP UI — UNCHANGED */}
        <div className="hidden md:flex h-full w-full">
          {/* Reuse elements with previous logic but ensure clean desktop view */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 z-[170] w-12 h-12 flex items-center justify-center bg-background/20 backdrop-blur-xl border border-white/10 text-foreground transition-all duration-300 rounded-full hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 shadow-2xl group"
          >
            <X size={22} className="transition-transform group-hover:rotate-90" />
          </button>

          <div className="w-1/2 relative bg-black overflow-hidden flex items-center justify-center">
            <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={currentImageIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.4 }
                }}
                src={images[currentImageIndex]}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Desktop Pagination Overlay */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[165] bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-auto">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentImageIndex ? 1 : -1);
                    setCurrentImageIndex(idx);
                  }}
                  className={`h-1 transition-all duration-500 rounded-full ${idx === currentImageIndex ? 'w-8 bg-primary shadow-[0_0_10px_white]' : 'w-2 bg-white/20'}`} 
                />
              ))}
            </div>

            <button onClick={() => paginate(-1)} className="absolute left-6 top-1/2 -translate-y-1/2 z-[165] w-12 h-12 flex items-center justify-center bg-black/20 backdrop-blur-xl border border-white/10 text-white rounded-full hover:bg-white hover:text-black transition-all">
              <ChevronLeft size={24} />
            </button>
            <button onClick={() => paginate(1)} className="absolute right-6 top-1/2 -translate-y-1/2 z-[165] w-12 h-12 flex items-center justify-center bg-black/20 backdrop-blur-xl border border-white/10 text-white rounded-full hover:bg-white hover:text-black transition-all">
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="w-1/2 h-full bg-card p-16 flex flex-col justify-center overflow-y-auto no-scrollbar relative border-l border-white/5">
            <span className="font-display text-[9px] tracking-[0.5em] text-muted-foreground uppercase mb-4 opacity-50">
              {product.category}
            </span>
            <h1 className="font-display text-5xl text-foreground tracking-[0.1em] uppercase leading-tight mb-6">
              {product.name}
            </h1>
            <p className="font-display text-2xl tracking-[0.2em] text-primary mb-12">
              {formatPrice(product.price)}
            </p>

            <div className="space-y-12">
              <div className="font-body text-base text-muted-foreground leading-relaxed max-w-md">
                {product.description}
              </div>

              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h4 className="font-display text-[9px] tracking-[0.4em] text-foreground/40 mb-6 uppercase">TAMANHOS</h4>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => {
                      const isSoldOut = size.endsWith('*');
                      const displayName = isSoldOut ? size.slice(0, -1) : size;
                      return (
                        <button
                          key={size}
                          disabled={isSoldOut}
                          onClick={() => setSelectedSize(size)}
                          className={`font-display text-xs w-12 h-12 border transition-all duration-300 ${isSoldOut
                              ? "border-white/5 text-white/10 cursor-not-allowed"
                              : selectedSize === size
                                ? "border-primary text-white bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                : "border-white/5 text-muted-foreground hover:border-white/40"
                            }`}
                        >
                          <span className={isSoldOut ? "line-through opacity-30" : ""}>{displayName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {product.colors && product.colors.length > 0 && (
                <div>
                  <h4 className="font-display text-[9px] tracking-[0.4em] text-foreground/40 mb-6 uppercase">CORES</h4>
                  <div className="flex flex-col gap-2">
                    {product.colors.map((color) => {
                      const isSoldOut = color.endsWith('*');
                      const displayName = isSoldOut ? color.slice(0, -1) : color;
                      return (
                        <button
                          key={color}
                          disabled={isSoldOut}
                          onClick={() => setSelectedColor(color)}
                          className={`font-display text-[10px] uppercase tracking-[0.3em] w-full py-4 border transition-all duration-300 text-left px-5 flex items-center justify-between ${isSoldOut
                              ? "border-white/5 text-white/10 cursor-not-allowed bg-black/40"
                              : selectedColor === color
                                ? "border-primary text-primary bg-white/5"
                                : "border-white/5 text-muted-foreground hover:border-white/40"
                            }`}
                        >
                          <span className={isSoldOut ? "line-through opacity-30" : ""}>{displayName}</span>
                          {selectedColor === color && !isSoldOut && <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_white]" />}
                          {isSoldOut && <span className="text-[7px] tracking-widest text-white/20">OUT</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity <= 0}
                className={`max-w-xs w-full py-5 border font-display tracking-[0.5em] text-xs flex items-center justify-center transition-all duration-500 ${product.stock_quantity > 0
                    ? "border-primary text-primary hover:bg-primary hover:text-black shadow-[0_0_50px_rgba(255,255,255,0.05)]"
                    : "border-white/5 text-white/10 cursor-not-allowed opacity-30"
                  }`}
              >
                {product.stock_quantity > 0 ? "ADICIONAR AO CARRINHO" : "ESGOTADO"}
              </button>
            </div>
          </div>
        </div>
        {/* DESKTOP UI — END */}

      </motion.div>
    </div>,
    document.body
  );
};

export default ProductModal;
