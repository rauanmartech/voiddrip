import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/components/ProductGrid";

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  products: ["products"] as const,
  trending: ["products", "trending"] as const,
  adminProducts: ["products", "admin"] as const,
};

// ─── Fetchers ────────────────────────────────────────────────────────────────
const fetchAllProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      product_views (
        view_count
      )
    `);

  if (error) throw error;

  return (data ?? []).map((p: any) => {
    let vc = 0;
    const views = p.product_views;
    if (views) {
      if (Array.isArray(views)) {
        vc = views[0]?.view_count || 0;
      } else if (typeof views === "object") {
        vc = (views as any).view_count || 0;
      }
    }
    return { ...p, view_count: vc };
  });
};

const fetchTrendingProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("product_views")
    .select(`view_count, products (*)`)
    .order("view_count", { ascending: false })
    .limit(3);

  if (error) throw error;

  return (data ?? [])
    .filter((item) => item.products !== null)
    .map((item) => item.products as unknown as Product);
};

const fetchAdminProducts = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

/** Main product catalog hook with 5-minute stale time */
export const useProducts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.products,
    queryFn: fetchAllProducts,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes in cache
    refetchOnWindowFocus: false,
  });
};

/** Trending top-3 hook — shorter stale time since views update often */
export const useTrendingProducts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.trending,
    queryFn: fetchTrendingProducts,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });
};

/** Admin product list hook */
export const useAdminProducts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.adminProducts,
    queryFn: fetchAdminProducts,
    staleTime: 0, // Always fresh for admin
    gcTime: 0,
  });
};

/** Prefetch products — call this on link hover to warm the cache */
export const usePrefetchProducts = () => {
  const queryClient = useQueryClient();

  const prefetchProducts = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.products,
      queryFn: fetchAllProducts,
      staleTime: 1000 * 60 * 5,
    });
  };

  const prefetchTrending = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.trending,
      queryFn: fetchTrendingProducts,
      staleTime: 1000 * 60 * 2,
    });
  };

  return { prefetchProducts, prefetchTrending };
};
