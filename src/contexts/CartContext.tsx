import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Product } from "@/components/ProductGrid";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  isSyncing: boolean;
  isInitialized: boolean;
  toggleCart: () => void;
  addToCart: (product: Product, size: string, color: string) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  cartTotal: number;
  itemCount: number;
}

const STORAGE_KEY = "@void_drip:cart";
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const hasMergedRef = useRef(false);
  const syncInProgress = useRef(false);

  // Initial Sync & Load
  useEffect(() => {
    if (authLoading) return;

    const handleSync = async () => {
      if (syncInProgress.current) return;
      syncInProgress.current = true;
      setIsSyncing(true);

      try {
        if (user) {
          // 1. Check Merge
          const savedLocal = localStorage.getItem(STORAGE_KEY);
          if (savedLocal && !hasMergedRef.current) {
            try {
              const localItems: CartItem[] = JSON.parse(savedLocal);
              if (localItems.length > 0) {
                for (const item of localItems) {
                  // Push to DB
                  const { data: existing } = await supabase
                    .from("carts")
                    .select("quantity")
                    .match({ user_id: user.id, product_id: item.product.id, size: item.size, color: item.color })
                    .maybeSingle();

                  const newQty = (existing?.quantity || 0) + item.quantity;
                  
                  await supabase.from("carts").upsert({
                    user_id: user.id,
                    product_id: item.product.id,
                    size: item.size,
                    color: item.color,
                    quantity: Math.min(newQty, item.product.stock_quantity)
                  });
                }
              }
              hasMergedRef.current = true;
              localStorage.removeItem(STORAGE_KEY);
              toast.success("Sessão sincronizada!");
            } catch (e) {
              console.error("Merge error", e);
            }
          }

          // 2. Load Truth from DB
          const { data: dbData, error } = await supabase
            .from("carts")
            .select("*, product:products(*)")
            .eq("user_id", user.id);

          if (error) throw error;
          setItems(dbData?.map(mapDbToCartItem) || []);
        } else {
          // Anonymous
          hasMergedRef.current = false;
          const savedLocal = localStorage.getItem(STORAGE_KEY);
          setItems(savedLocal ? JSON.parse(savedLocal) : []);
        }
      } catch (err) {
        console.error("Cart init error:", err);
      } finally {
        setIsSyncing(false);
        setIsInitialized(true);
        syncInProgress.current = false;
      }
    };

    handleSync();
  }, [user, authLoading]);

  // Sync Local Storage (only for Anonymous)
  useEffect(() => {
    if (!user && isInitialized) {
      if (items.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [items, user, isInitialized]);

  const mapDbToCartItem = (dbItem: any): CartItem => {
    const size = dbItem.size || "Padrão";
    const color = dbItem.color || "Padrão";
    return {
      id: `${dbItem.product_id}-${size}-${color}`,
      product: dbItem.product,
      quantity: dbItem.quantity,
      size,
      color
    };
  };

  const toggleCart = () => setIsCartOpen(prev => !prev);

  // --- ACTIONS ---

  const addToCart = async (product: Product, size: string, color: string) => {
    const displaySize = size || "Padrão";
    const displayColor = color || "Padrão";
    const newItemId = `${product.id}-${displaySize}-${displayColor}`;
    
    // 1. Optimistic Update
    setItems((prev) => {
      const existing = prev.find(i => i.id === newItemId);
      if (existing) {
        return prev.map(i => i.id === newItemId ? { ...i, quantity: Math.min(i.quantity + 1, product.stock_quantity) } : i);
      }
      return [...prev, { id: newItemId, product, quantity: 1, size: displaySize, color: displayColor }];
    });

    // 2. Background Sync
    if (user) {
      setIsSyncing(true);
      
      const sizeVal = (size === "Padrão" || !size) ? null : size;
      const colorVal = (color === "Padrão" || !color) ? null : color;

      const { data: existing } = await supabase
        .from("carts")
        .select("quantity")
        .match({ 
          user_id: user.id, 
          product_id: product.id, 
          size: sizeVal, 
          color: colorVal 
        })
        .maybeSingle();

      const newQty = (existing?.quantity || 0) + 1;
      const { error } = await supabase.from("carts").upsert({
        user_id: user.id,
        product_id: product.id,
        size: sizeVal,
        color: colorVal,
        quantity: Math.min(newQty, product.stock_quantity)
      });
      if (error) {
        console.error("Add error", error);
        toast.error("Erro ao adicionar no banco");
      }
      setIsSyncing(false);
    }
    toast.success(`${product.name} no carrinho!`);
  };

  const removeFromCart = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // 1. Optimistic
    setItems(prev => prev.filter(i => i.id !== itemId));

    // 2. Sync
    if (user) {
      setIsSyncing(true);
      
      const sizeVal = (item.size === "Padrão" || !item.size) ? null : item.size;
      const colorVal = (item.color === "Padrão" || !item.color) ? null : item.color;

      // To handle potential legacy "" values and null consistently
      let query = supabase.from("carts").delete().eq("user_id", user.id).eq("product_id", item.product.id);
      
      if (sizeVal === null) {
        query = query.or('size.is.null,size.eq.""');
      } else {
        query = query.eq('size', sizeVal);
      }
      
      if (colorVal === null) {
        query = query.or('color.is.null,color.eq.""');
      } else {
        query = query.eq('color', colorVal);
      }

      const { error } = await query;

      if (error) {
        console.error("Delete error", error);
        toast.error("Erro ao remover do banco");
      }
      setIsSyncing(false);
    }
    toast.success("Item removido");
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    const item = items.find(i => i.id === itemId);
    if (!item || quantity > item.product.stock_quantity) return;

    // 1. Optimistic
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));

    // 2. Sync
    if (user) {
      setIsSyncing(true);
      const sizeVal = (item.size === "Padrão" || !item.size) ? null : item.size;
      const colorVal = (item.color === "Padrão" || !item.color) ? null : item.color;

      let query = supabase.from("carts").update({ quantity }).eq("user_id", user.id).eq("product_id", item.product.id);

      if (sizeVal === null) {
        query = query.or('size.is.null,size.eq.""');
      } else {
        query = query.eq('size', sizeVal);
      }
      
      if (colorVal === null) {
        query = query.or('color.is.null,color.eq.""');
      } else {
        query = query.eq('color', colorVal);
      }

      const { error } = await query;

      if (error) {
        console.error("Update error", error);
      }
      setIsSyncing(false);
    }
  };

  const cartTotal = items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, isCartOpen, isSyncing, isInitialized, toggleCart, addToCart, removeFromCart, updateQuantity, cartTotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error("useCart must be used within a CartProvider");
  return context;
};
