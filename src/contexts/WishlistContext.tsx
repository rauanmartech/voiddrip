import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Product } from "@/components/ProductGrid";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface WishlistContextType {
  wishlistItems: Product[];
  isWishlistSyncing: boolean;
  isWishlistInitialized: boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => Promise<void>;
  wishlistCount: number;
}

const WISHLIST_STORAGE_KEY = "@void_drip:wishlist";
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isWishlistSyncing, setIsWishlistSyncing] = useState(false);
  const [isWishlistInitialized, setIsWishlistInitialized] = useState(false);
  
  const hasMergedRef = useRef(false);
  const syncInProgress = useRef(false);

  // Initial Sync & Load
  useEffect(() => {
    if (authLoading) return;

    const handleSync = async () => {
      if (syncInProgress.current) return;
      syncInProgress.current = true;
      setIsWishlistSyncing(true);

      try {
        if (user) {
          // 1. Sincronizar itens do localStorage para o banco se o usuário acabou de logar
          const savedLocal = localStorage.getItem(WISHLIST_STORAGE_KEY);
          if (savedLocal && !hasMergedRef.current) {
            try {
              const localItems: Product[] = JSON.parse(savedLocal);
              if (localItems.length > 0) {
                // Sincronizando favoritos locais para o banco
                for (const item of localItems) {
                  await supabase.from("wishlists").upsert({
                    user_id: user.id,
                    product_id: item.id
                  });
                }
                toast.success("Favoritos sincronizados!");
              }
              hasMergedRef.current = true;
              localStorage.removeItem(WISHLIST_STORAGE_KEY);
            } catch (e) {
              console.error("Erro ao sincronizar favoritos locais:", e);
            }
          }

          // 2. Carregar do banco de dados (Verdade absoluta)
          const { data: dbData, error } = await supabase
            .from("wishlists")
            .select("*, product:products(*)")
            .eq("user_id", user.id);

          if (error) throw error;
          const mappedProducts = dbData?.map(item => item.product).filter(Boolean) as Product[];
          setWishlistItems(mappedProducts || []);
        } else {
          // Usuário Anônimo: Carregar apenas do localStorage
          hasMergedRef.current = false;
          const savedLocal = localStorage.getItem(WISHLIST_STORAGE_KEY);
          setWishlistItems(savedLocal ? JSON.parse(savedLocal) : []);
        }
      } catch (err) {
        console.error("Erro ao inicializar favoritos:", err);
      } finally {
        setIsWishlistSyncing(false);
        setIsWishlistInitialized(true);
        syncInProgress.current = false;
      }
    };

    handleSync();
  }, [user, authLoading]);

  // Sincronizar cache local (apenas para anônimos)
  useEffect(() => {
    if (!user && isWishlistInitialized) {
      if (wishlistItems.length > 0) {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
      } else {
        localStorage.removeItem(WISHLIST_STORAGE_KEY);
      }
    }
  }, [wishlistItems, user, isWishlistInitialized]);

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(p => p.id === productId);
  };

  const toggleWishlist = async (product: Product) => {
    const isCurrentlyIn = isInWishlist(product.id);
    
    // Atualização Otimista
    if (isCurrentlyIn) {
      setWishlistItems(prev => prev.filter(p => p.id !== product.id));
    } else {
      setWishlistItems(prev => [...prev, product]);
    }

    if (user) {
      setIsWishlistSyncing(true);
      if (isCurrentlyIn) {
        // Remover do banco
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .match({ user_id: user.id, product_id: product.id });
        
        if (error) {
          console.error("Erro ao remover favorito do banco:", error);
          toast.error("Erro ao remover dos favoritos.");
        } else {
           toast.success("Removido dos favoritos.");
        }
      } else {
        // Adicionar no banco
        const { error } = await supabase
          .from("wishlists")
          .insert({ user_id: user.id, product_id: product.id });
          
        if (error) {
          console.error("Erro ao adicionar favorito no banco:", error);
          toast.error("Erro ao salvar nos favoritos.");
        } else {
          toast.success("Adicionado aos favoritos!");
        }
      }
      setIsWishlistSyncing(false);
    } else {
      // Feedback toast para anônimos
      if (isCurrentlyIn) {
        toast.success("Removido dos favoritos.");
      } else {
        toast.success("Adicionado aos favoritos!");
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
     // Atalho para o toggle
     const product = wishlistItems.find(p => p.id === productId);
     if (product) await toggleWishlist(product);
  };

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      isWishlistSyncing,
      isWishlistInitialized,
      toggleWishlist,
      isInWishlist,
      removeFromWishlist,
      wishlistCount
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) throw new Error("useWishlist deve ser usado dentro de um WishlistProvider");
  return context;
};
