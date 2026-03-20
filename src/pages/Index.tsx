import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrendingSection from "@/components/TrendingSection";
import CategoryFilter from "@/components/CategoryFilter";
import ProductGrid from "@/components/ProductGrid";
import GridControls from "@/components/GridControls";
import GeoDivider from "@/components/GeoDivider";
import CosmicElements from "@/components/CosmicElements";
import Footer from "@/components/Footer";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState("popular");

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <HeroSection />
      <TrendingSection />

      {/* Products section — all products, no limit */}
      <section className="relative spacetime-grid">
        <CosmicElements />
        <div className="relative z-10">
          <div className="text-center pt-20 pb-4">
            <h2 className="font-display text-2xl md:text-3xl tracking-[0.3em] text-foreground">
              COLEÇÃO
            </h2>
            <p className="font-body text-xs text-muted-foreground mt-3 tracking-wider">
              Caia no vazio
            </p>
          </div>
          <CategoryFilter
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          <GridControls
            showOnlyAvailable={showOnlyAvailable}
            setShowOnlyAvailable={setShowOnlyAvailable}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
          <ProductGrid
            activeCategory={activeCategory}
            showOnlyAvailable={showOnlyAvailable}
            sortBy={sortBy}
            limit={null}
          />
        </div>
      </section>

      <GeoDivider />
      <Footer />
    </div>
  );
};

export default Index;
