import ProductCard from "./ProductCard";

import { motion, AnimatePresence } from "framer-motion";
import { trackProductView } from "@/lib/analytics";
import { Link, useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  sizes: string[] | null;
  colors: string[] | null;
  stock_quantity: number;
  image_url: string | null;
  created_at: string;
  view_count?: number;
}

interface ProductGridProps {
  activeCategory: string;
  showOnlyAvailable: boolean;
  sortBy: string;
  limit?: number | null;
}

const ProductGrid = ({ activeCategory, showOnlyAvailable, sortBy, limit = null }: ProductGridProps) => {
  const navigate = useNavigate();

  // ── React Query: cached, shared, no duplicate fetches ──────────────────────
  const { data: products = [], isLoading } = useProducts();

  const handleProductClick = (product: Product) => {
    navigate(`/produto/${product.id}`);
    trackProductView(product.id).catch(err => console.error("Tracking error:", err));
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
    const matchesAvailable = !showOnlyAvailable || p.stock_quantity > 0;
    return matchesCategory && matchesAvailable;
  });

  const allSortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "popular") {
      const stockA = a.stock_quantity > 0 ? 1 : 0;
      const stockB = b.stock_quantity > 0 ? 1 : 0;
      if (stockA !== stockB) return stockB - stockA;

      const viewsA = a.view_count || 0;
      const viewsB = b.view_count || 0;
      if (viewsA !== viewsB) return viewsB - viewsA;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "type") return a.category.localeCompare(b.category);
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    return 0;
  });

  const hasMore = limit && allSortedProducts.length > limit;
  const sortedProducts = limit ? allSortedProducts.slice(0, limit) : allSortedProducts;

  const gridElements: { type: string; id: string; data?: Product; label?: string }[] = [];
  let lastCategory = "";

  const top3Ids = [...products]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 3)
    .map(p => p.id);

  sortedProducts.forEach((product) => {
    const showDivider = sortBy === "type" && product.category !== lastCategory;
    if (showDivider) {
      lastCategory = product.category;
      gridElements.push({ type: 'divider', id: `divider-${product.category}`, label: product.category });
    }
    gridElements.push({ type: 'product', id: product.id, data: product });
  });

  return (
    <section id="collection" className="container mx-auto px-6 pb-20 overflow-hidden">
      {isLoading ? (
        <div className="flex justify-center items-center py-32">
          <div className="w-8 h-8 border-y border-foreground rounded-full animate-spin"></div>
        </div>
      ) : sortedProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32 border border-border bg-card/10 backdrop-blur-sm"
        >
          <p className="font-display text-sm md:text-lg tracking-[0.3em] text-muted-foreground uppercase">
            NENHUM PRODUTO EM {activeCategory.toUpperCase()}
          </p>
        </motion.div>
      ) : (
        <>
          <motion.div
            layout
            className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {gridElements.map((element, idx) => (
                <motion.div
                  key={element.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.25 } }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 40,
                    mass: 1,
                    layout: { duration: 0.45, ease: [0.23, 1, 0.32, 1] }
                  }}
                  className={element.type === 'divider' ? "col-span-full" : ""}
                >
                  {element.type === 'divider' ? (
                    <div className="flex items-center gap-6 py-12 md:py-16">
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-white/20 opacity-30" />
                      <h2 className="font-display text-xs md:text-sm tracking-[0.4em] text-foreground uppercase whitespace-nowrap">
                        {element.label}
                      </h2>
                      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-white/20 to-white/20 opacity-30" />
                    </div>
                  ) : (
                    <div className="h-full">
                      <ProductCard
                        product={element.data as Product}
                        onClick={() => handleProductClick(element.data as Product)}
                        isTrending={top3Ids.includes(element.id)}
                        // First 6 cards are above fold — load eagerly
                        eager={idx < 6}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {hasMore && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-20 flex justify-center"
            >
              <Link
                to="/colecao"
                className="group relative px-10 py-4 bg-white/5 border border-white/10 hover:border-white/40 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative font-display text-[10px] tracking-[0.5em] text-foreground uppercase group-hover:text-white transition-colors">
                  VER MAIS
                </span>
                <div className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-white/20" />
                <div className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-white/20" />
              </Link>
            </motion.div>
          )}
        </>
      )}

    </section>
  );
};

export default ProductGrid;
