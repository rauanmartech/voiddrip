import { motion } from "framer-motion";

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = ["Todos", "Camisetas", "Moletons", "Calças", "Tênis", "Acessórios"];

const CategoryFilter = ({ activeCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 py-12 px-6">
      {categories.map((cat) => (
        <motion.button
          key={cat}
          onClick={() => onCategoryChange(cat)}
          className={`relative pill-filter ${activeCategory === cat ? "pill-filter-active" : ""}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {activeCategory === cat && (
            <motion.div
              layoutId="activeCategory"
              className="absolute inset-0 bg-white/[0.03] shadow-[0_0_15px_rgba(255,255,255,0.1)] -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          {cat}
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryFilter;
