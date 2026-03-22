import { motion, AnimatePresence } from "framer-motion";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShoppingBag, Trash2, Heart, ArrowRight, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import ProductModal from "@/components/ProductModal";
import { useState } from "react";
import { Product } from "@/components/ProductGrid";

export default function Favorites() {
  const { wishlistItems, removeFromWishlist, wishlistCount } = useWishlist();
  const { addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleMoveToCart = (product: any) => {
    setSelectedProduct(product);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary selection:text-black">
      <Navbar />
      
      <main className="container mx-auto px-6 pt-32 pb-20">
        <header className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <Heart 
              size={32} 
              className="text-[#FF1CF7] drop-shadow-[0_0_12px_rgba(255,28,247,0.8)]" 
              fill="currentColor" 
            />
            <h1 className="font-display text-4xl uppercase tracking-[0.2em]">Meus Favoritos</h1>
          </motion.div>
          <p className="text-muted-foreground tracking-widest uppercase text-[10px] font-bold border-l-2 border-primary pl-4">
            {wishlistCount} {wishlistCount === 1 ? 'item salvo' : 'itens salvos'} na sua wishlist cósmica
          </p>
        </header>

        <AnimatePresence mode="popLayout">
          {wishlistItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {wishlistItems.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  {/* DESKTOP: Vertical Card */}
                  <div className="hidden md:block h-full">
                    <Card className={`bg-white/[0.02] border-white/5 overflow-hidden rounded-none group-hover:border-primary/30 transition-all duration-500 flex flex-col h-full ${product.stock_quantity <= 0 ? 'opacity-60' : ''}`}>
                      <Link to={`/produto/${product.id}`} className="block relative aspect-[3/4] overflow-hidden flex-shrink-0">
                        <img 
                          src={product.image_url?.split(',')[0]} 
                          alt={product.name}
                          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${product.stock_quantity <= 0 ? 'grayscale' : 'opacity-80'}`}
                          loading="lazy"
                        />
                        {product.stock_quantity <= 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-[2px]">
                            <span className="font-display text-[10px] tracking-[0.5em] text-white border border-white/20 px-4 py-2 uppercase">ESGOTADO</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-60" />
                      </Link>

                      <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-display text-sm tracking-widest uppercase mb-1 line-clamp-1">{product.name}</h3>
                          <p className={`font-display text-lg tracking-wider ${product.stock_quantity <= 0 ? 'text-muted-foreground' : 'text-primary'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={() => handleMoveToCart(product)}
                            disabled={product.stock_quantity <= 0}
                            className={`flex-1 font-display text-[10px] tracking-[0.2em] font-bold h-12 rounded-none transition-all ${
                              product.stock_quantity <= 0 
                                ? "bg-white/5 text-white/20 border-white/5 cursor-not-allowed" 
                                : "bg-white text-black hover:bg-primary"
                            }`}
                          >
                            <ShoppingBag size={14} className="mr-2" /> {product.stock_quantity <= 0 ? "ESGOTADO" : "COMPRAR"}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => removeFromWishlist(product.id)}
                            className="w-12 h-12 border-white/10 hover:bg-red-500/10 hover:text-red-500 transition-all rounded-none flex-shrink-0 p-0"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* MOBILE: Horizontal List Card */}
                  <div className="md:hidden">
                    <Card className={`relative flex bg-white/[0.02] border-white/5 rounded-none overflow-hidden h-36 border-l-2 ${product.stock_quantity <= 0 ? 'opacity-60 border-l-muted' : 'border-l-primary'}`}>
                      <Link to={`/produto/${product.id}`} className="w-28 flex-shrink-0 relative overflow-hidden">
                        <img 
                          src={product.image_url?.split(',')[0]} 
                          alt={product.name}
                          className={`w-full h-full object-cover ${product.stock_quantity <= 0 ? 'grayscale' : 'opacity-80'}`}
                        />
                        {product.stock_quantity <= 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
                            <span className="font-display text-[8px] tracking-[0.3em] text-white border border-white/10 px-2 py-1 uppercase">ESGOTADO</span>
                          </div>
                        )}
                      </Link>
                      
                      <div className="flex-1 p-4 flex flex-col justify-between overflow-hidden">
                        <div className="space-y-1">
                          <h3 className="font-display text-[9px] tracking-widest uppercase truncate text-muted-foreground">{product.name}</h3>
                          <p className={`font-display text-base tracking-wider ${product.stock_quantity <= 0 ? 'text-muted-foreground' : 'text-primary'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleMoveToCart(product)}
                            disabled={product.stock_quantity <= 0}
                            className={`flex-1 h-10 font-display text-[8px] tracking-[0.2em] font-bold rounded-none transition-all ${
                              product.stock_quantity <= 0 
                                ? "bg-white/5 text-white/10 border-white/5" 
                                : "bg-white text-black active:bg-primary"
                            }`}
                          >
                            {product.stock_quantity <= 0 ? "STOCKED OUT" : "COMPRAR"}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => removeFromWishlist(product.id)}
                            className="w-10 h-10 border-white/10 rounded-none flex-shrink-0 p-0"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-8 border border-white/10">
                <Ghost size={48} />
              </div>
              <h2 className="font-display text-2xl uppercase tracking-[0.3em] mb-4">Sua lista está vazia</h2>
              <p className="text-muted-foreground max-w-sm mb-12 tracking-widest text-[10px] uppercase font-bold px-6 border-x border-white/10">
                O vazio clama por novas peças. Explore nossa coleção e salve seus itens favoritos aqui.
              </p>
              <Button asChild className="h-14 px-12 bg-white text-black hover:bg-primary tracking-[0.3em] font-display font-bold">
                <Link to="/">EXPLORAR COLEÇÃO <ArrowRight size={16} className="ml-2" /></Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
      
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
