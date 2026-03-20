import { useState, useEffect } from "react";
import { Product } from "./ProductGrid";
import { ShoppingBag, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const nextImage = () => {
    if (images.length > 1) {
      setDirection(1);
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setDirection(-1);
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    // ── Preload all images for smooth navigation ─────────────────────────────
    images.forEach((url) => {
      const img = new Image();
      img.src = url;
    });

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [images]);

  // Gallery transition variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.1
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 }
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9,
      transition: {
        x: { type: "spring" as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 }
      }
    })
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-background/95 backdrop-blur-md p-0 md:p-12">
      {/* Background overlay for click-to-close */}
      <div 
        className="absolute inset-0 cursor-pointer pointer-events-auto" 
        onClick={onClose}
      />

      <motion.div 
        layoutId={`product-${product.id}`}
        initial={{ opacity: 0, scale: 0.9, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 100 }}
        className="relative w-full h-[92vh] md:h-[80vh] md:w-[85vw] bg-card border-none md:border md:border-border shadow-2xl flex flex-col md:flex-row overflow-hidden rounded-t-[2.5rem] md:rounded-none z-[160]"
      >
        {/* Mobile Header - Improved for access */}
        <div className="md:hidden absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-background/80 to-transparent z-[180] flex items-center justify-between px-6 pointer-events-none">
          <div className="flex flex-col pointer-events-auto">
             <span className="font-display text-[9px] tracking-[0.4em] text-white/50 uppercase">{product.category}</span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 text-foreground rounded-full active:scale-90 transition-transform pointer-events-auto"
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="hidden md:flex absolute top-8 right-8 z-[180] w-10 h-10 items-center justify-center bg-background/20 backdrop-blur-xl border border-white/10 text-foreground transition-all duration-300 rounded-full hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 shadow-2xl group"
        >
          <X size={20} className="transition-transform group-hover:rotate-90" />
        </button>

        {/* Gallery Section */}
        <div className="w-full h-1/2 md:h-full md:w-1/2 relative bg-secondary overflow-hidden">
          <div className="w-full h-full relative flex items-center justify-center">
            <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={currentImageIndex}
                src={images[currentImageIndex]}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 100) prevImage();
                  else if (info.offset.x < -100) nextImage();
                }}
                className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
              />
            </AnimatePresence>

            {images.length > 1 && (
              <>
                <div className="hidden md:flex absolute inset-x-6 top-1/2 -translate-y-1/2 justify-between z-10 pointer-events-none">
                  <button 
                    onClick={(e) => { e.stopPropagation(); prevImage(); }} 
                    className="w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-xl border border-white/10 text-white rounded-full hover:bg-white hover:text-black transition-all pointer-events-auto"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); nextImage(); }} 
                    className="w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-xl border border-white/10 text-white rounded-full hover:bg-white hover:text-black transition-all pointer-events-auto"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
                
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                  {images.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1 transition-all duration-500 rounded-full ${idx === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/20'}`} 
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className="w-full h-1/2 md:h-full md:w-1/2 p-6 md:p-16 flex flex-col bg-card relative z-20 overflow-y-auto custom-scrollbar">
          {/* Drag Handle Indicator */}
          <div className="w-12 h-1 bg-white/10 rounded-full mx-auto md:hidden mb-10 flex-shrink-0" />

          <div className="flex-grow">
            <p className="hidden md:block font-display text-[9px] md:text-[10px] tracking-[0.4em] text-muted-foreground uppercase mb-4">
              {product.category}
            </p>
            <h1 className="font-display text-2xl md:text-5xl text-foreground mb-4 md:mb-8 tracking-widest uppercase leading-tight">
              {product.name}
            </h1>
            <p className="font-display text-2xl md:text-3xl text-primary mb-10 md:mb-16 tracking-wider">
              {formatPrice(product.price)}
            </p>

            {product.description && (
              <div className="font-body text-sm md:text-base text-muted-foreground/80 leading-relaxed mb-12 whitespace-pre-wrap max-w-lg">
                {product.description}
              </div>
            )}

            <div className="flex flex-col gap-12 mb-12">
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <span className="font-display text-[9px] md:text-[10px] tracking-[0.3em] text-foreground/40 block mb-6 uppercase">TAMANHO</span>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`font-display text-xs w-12 h-12 border transition-all duration-300 ${selectedSize === size
                            ? "border-primary text-primary bg-primary/5 shadow-[0_0_25px_rgba(255,255,255,0.1)]"
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
                  <span className="font-display text-[9px] md:text-[10px] tracking-[0.3em] text-foreground/40 block mb-6 uppercase">COR</span>
                  <div className="flex flex-wrap gap-4">
                    {product.colors.map((color) => {
                      const isSoldOut = color.endsWith('*');
                      const displayName = isSoldOut ? color.slice(0, -1) : color;
                      return (
                        <button
                          key={color}
                          disabled={isSoldOut}
                          onClick={() => setSelectedColor(color)}
                          className={`font-display text-[10px] uppercase tracking-widest px-8 py-4 border transition-all duration-300 relative ${isSoldOut
                              ? "border-border text-muted-foreground/20 cursor-not-allowed"
                              : selectedColor === color
                                ? "border-primary text-primary bg-primary/5 shadow-[0_0_25px_rgba(255,255,255,0.1)]"
                                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                        >
                          <span className={isSoldOut ? "line-through opacity-50 text-muted-foreground/50" : ""}>{displayName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 pt-8 pb-4 md:pb-0 bg-gradient-to-t from-card via-card to-transparent mt-auto z-10 w-full">
            <button
              disabled={product.stock_quantity <= 0}
              className={`w-full py-6 md:py-5 px-8 border font-display tracking-[0.4em] text-xs flex items-center justify-center gap-4 transition-all duration-500 ${product.stock_quantity > 0
                  ? "border-primary text-white bg-primary hover:bg-transparent hover:text-primary hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                  : "border-border text-muted-foreground cursor-not-allowed opacity-50"
                }`}
            >
              <ShoppingBag size={20} />
              {product.stock_quantity > 0 ? "ADICIONAR AO CARRINHO" : "ESGOTADO"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductModal;

