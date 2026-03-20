import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/components/ProductGrid";
import { toast } from "sonner";

export interface CartItem {
  id: string; // Unique ID (product.id + size + color)
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  toggleCart: () => void;
  addToCart: (product: Product, size: string, color: string) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  cartTotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load from localStorage if available
    try {
      const saved = localStorage.getItem("void_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("void_cart", JSON.stringify(items));
  }, [items]);

  const toggleCart = () => setIsCartOpen(prev => !prev);

  const addToCart = (product: Product, size: string, color: string) => {
    setItems((prev) => {
      const existingItemIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.size === size && item.color === color
      );

      if (existingItemIndex >= 0) {
        // Item already in cart, increment quantity
        const newItems = [...prev];
        if (newItems[existingItemIndex].quantity < product.stock_quantity) {
          newItems[existingItemIndex].quantity += 1;
          toast.success("Quantidade atualizada no carrinho");
        } else {
          toast.error("Limite de estoque atingido");
        }
        return newItems;
      }

      // Add new item
      toast.success(`${product.name} adicionado ao carrinho`);
      return [...prev, { id: `${product.id}-${size}-${color}`, product, quantity: 1, size, color }];
    });
    
    // Automatically open cart when adding
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Item removido");
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setItems((prev) => 
      prev.map((item) => {
        if (item.id === id) {
          // Check stock
          if (quantity > item.product.stock_quantity) {
            toast.error("Limite de estoque atingido");
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const cartTotal = items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, isCartOpen, toggleCart, addToCart, removeFromCart, updateQuantity, cartTotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
