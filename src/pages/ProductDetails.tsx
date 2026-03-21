import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag, ChevronLeft, ChevronRight, ArrowLeft, ShieldCheck, Truck, Clock, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/components/ProductGrid";

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const { addToCart, toggleCart } = useCart();

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.id !== product.id && (p.category === product.category || p.category.toLowerCase().includes("acess")))
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
  }, [products, product]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (product) {
      if (product.sizes?.length) setSelectedSize(product.sizes[0]);
      if (product.colors?.length) setSelectedColor(product.colors[0]);
    }
    
    // Fake delivery date calculation (now + 5 to 7 days)
    const today = new Date();
    today.setDate(today.getDate() + 5);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    setDeliveryDate(today.toLocaleDateString('pt-BR', options));
    
  }, [product, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-y border-primary rounded-full animate-spin mb-4" />
        <p className="font-display text-xs tracking-[0.5em] text-muted-foreground uppercase animate-pulse">
          INICIANDO CONEXÃO...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="font-display text-4xl mb-4 text-foreground uppercase tracking-widest">ARTEFATO PERDIDO</h1>
        <button onClick={() => navigate(-1)} className="px-8 py-3 bg-white/5 border border-white/10 hover:border-white/40 transition-all font-display text-xs tracking-[0.3em]">
          RETORNAR À BASE
        </button>
      </div>
    );
  }

  const images = product.image_url ? product.image_url.split(",") : [];
  
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
    toggleCart();
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentImageIndex((prev) => (prev + newDirection + images.length) % images.length);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);
  };

  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const isSoldOut = product.stock_quantity <= 0;

  const imageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pt-24 pb-32 min-h-screen bg-background relative overflow-hidden"
    >
      {/* Background Atmosphere */}
      <div className="absolute top-0 right-0 w-full h-[60vh] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none opacity-50" />
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        
        {/* Top Navigation */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-display text-[10px] tracking-[0.3em] uppercase">VOLTAR</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-12 xl:gap-24">
          
          {/* Left Column: Image Gallery */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="relative aspect-[4/5] bg-black/40 border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center group shadow-2xl">
              
              {/* Markers */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
                {isLowStock && (
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-full bg-red-500/20 blur-md scale-150 animate-pulse" />
                    <div
                      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-400/60 backdrop-blur-md overflow-hidden whitespace-nowrap"
                      style={{ background: 'linear-gradient(to right, rgba(220,38,38,0.85), rgba(239,68,68,0.75), rgba(248,113,113,0.65))' }}
                    >
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                          backgroundSize: '200% 100%',
                          animation: 'badge-shimmer 2.5s linear infinite',
                        }}
                      />
                      <Timer
                        size={11}
                        className="relative text-white drop-shadow-[0_0_5px_rgba(239,68,68,1)]"
                        style={{ animation: 'pulse 0.9s ease-in-out infinite' }}
                      />
                      <span className="relative font-display text-[8px] tracking-[0.25em] text-white uppercase font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                        RESTAM {product.stock_quantity}
                      </span>
                    </div>
                  </div>
                )}
                {isSoldOut && (
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-white/5 blur-md scale-150" />
                    <div
                      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md overflow-hidden whitespace-nowrap"
                      style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.8), rgba(40,40,40,0.8))' }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
                      <span className="relative font-display text-[8px] tracking-[0.25em] text-foreground uppercase font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                        ESGOTADO
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={currentImageIndex}
                  custom={direction}
                  variants={imageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  className="absolute inset-0 w-full h-full"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -40) paginate(1);
                    else if (info.offset.x > 40) paginate(-1);
                  }}
                >
                  <img
                    src={images[currentImageIndex]}
                    alt={`${product.name} - Imagem ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover object-center"
                    loading={currentImageIndex === 0 ? "eager" : "lazy"}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button onClick={() => paginate(-1)} className="absolute left-4 w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-black">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => paginate(1)} className="absolute right-4 w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-black">
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                {images.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDirection(idx > currentImageIndex ? 1 : -1);
                      setCurrentImageIndex(idx);
                    }}
                    className={`relative w-24 h-24 flex-shrink-0 border transition-all duration-300 rounded-xl overflow-hidden ${
                      idx === currentImageIndex ? "border-primary opacity-100 scale-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "border-white/5 opacity-50 scale-95 hover:opacity-100"
                    }`}
                  >
                    <img src={src} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Details */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            
            <div className="mb-8">
              <span className="font-display text-[9px] tracking-[0.5em] text-primary uppercase mb-4 block">
                {product.category}
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground uppercase tracking-wider leading-tight mb-4 drop-shadow-md">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <span className="font-display text-2xl md:text-3xl text-white tracking-[0.1em]">
                  {formatPrice(product.price)}
                </span>
                {/* Installment example if applicable */}
                <span className="font-display text-[10px] tracking-[0.2em] text-muted-foreground uppercase px-3 py-1 border border-white/10 rounded-full">
                  ATÉ 12X SEM JUROS
                </span>
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-muted-foreground font-body text-sm md:text-base leading-relaxed font-light mb-10">
              <p>{product.description}</p>
            </div>

            <div className="space-y-8 mb-10">
              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-display text-[10px] tracking-[0.3em] text-foreground uppercase">Tamanho</h4>
                    <button className="font-display text-[9px] tracking-[0.2em] text-primary/70 underline underline-offset-4 hover:text-primary transition-colors">
                      GUIA DE MEDIDAS
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => {
                      const isVariantSoldOut = size.endsWith("*");
                      const cleanSize = isVariantSoldOut ? size.slice(0, -1) : size;
                      return (
                        <button
                          key={size}
                          disabled={isVariantSoldOut}
                          onClick={() => setSelectedSize(size)}
                          className={`font-display text-xs w-14 h-14 border rounded-lg transition-all duration-300 relative overflow-hidden ${
                            isVariantSoldOut
                              ? "border-white/5 text-white/20 bg-white/5 cursor-not-allowed"
                              : selectedSize === size
                              ? "border-primary text-primary bg-primary/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                              : "border-white/10 text-muted-foreground hover:border-white/30 hover:bg-white/5"
                          }`}
                        >
                          {isVariantSoldOut && (
                            <div className="absolute top-1/2 left-0 w-full h-px bg-white/20 -rotate-45" />
                          )}
                          <span className="relative z-10">{cleanSize}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <h4 className="font-display text-[10px] tracking-[0.3em] text-foreground uppercase mb-4">Cor da Variante</h4>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => {
                      const isVariantSoldOut = color.endsWith("*");
                      const cleanColor = isVariantSoldOut ? color.slice(0, -1) : color;
                      return (
                        <button
                          key={color}
                          disabled={isVariantSoldOut}
                          onClick={() => setSelectedColor(color)}
                          className={`font-display text-[10px] px-6 py-3 border rounded-full transition-all duration-300 uppercase tracking-[0.2em] relative overflow-hidden ${
                            isVariantSoldOut
                              ? "border-white/5 text-white/20 bg-white/5 cursor-not-allowed"
                              : selectedColor === color
                              ? "border-primary text-black bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                              : "border-white/10 text-muted-foreground hover:border-white/30 hover:bg-white/5"
                          }`}
                        >
                          {isVariantSoldOut && (
                            <div className="absolute top-1/2 left-0 w-full h-px bg-white/20 -rotate-6" />
                          )}
                          <span className="relative z-10">{cleanColor}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Action Area */}
            <div className="flex flex-col gap-4">
              <button
                onClick={handleAddToCart}
                disabled={isSoldOut}
                className={`w-full py-5 rounded-xl font-display uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-3 transition-all duration-500 relative overflow-hidden group ${
                  isSoldOut
                    ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                    : "bg-white text-black hover:bg-gray-200 border border-white"
                }`}
              >
                {!isSoldOut && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_1.5s_infinite]" />
                )}
                <ShoppingBag size={16} className={isSoldOut ? "opacity-50" : ""} />
                <span className="relative z-10 font-bold">
                  {isSoldOut ? "FORA DE ÓRBITA" : "ADICIONAR AO CARRINHO"}
                </span>
              </button>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl justify-center text-center backdrop-blur-sm">
                  <Truck size={18} className="text-primary/70 flex-shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="font-display text-[8px] tracking-[0.2em] text-muted-foreground uppercase">Estimativa Padrão</span>
                    <span className="font-body text-xs text-white">Receba até {deliveryDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl justify-center text-center backdrop-blur-sm">
                  <ShieldCheck size={18} className="text-primary/70 flex-shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="font-display text-[8px] tracking-[0.2em] text-muted-foreground uppercase">Autenticidade</span>
                    <span className="font-body text-xs text-white">100% Garantida</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RELATED PRODUCTS ("Compre Junto" / "Cross-selling") */}
        {relatedProducts.length > 0 && (
          <div className="mt-32 pt-16 border-t border-white/10">
            <div className="mb-12 flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl md:text-3xl text-foreground tracking-[0.1em] uppercase mb-2">COMPLETE O DRIP</h3>
                <p className="font-display text-[10px] tracking-[0.3em] text-muted-foreground uppercase">Sugestões baseadas na sua escolha</p>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onClick={() => {
                    navigate(`/produto/${p.id}`);
                  }}
                  isTrending={false}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default ProductDetails;
